import { DOMParser as XmlDomParser } from '@xmldom/xmldom'

import type { ResearchSourceSettings } from '../../types/research.types'

import { getResearchAdapter } from './ResearchAdapters'
import type { ResearchHttpClient } from './ResearchHttpClient'
import type { ResearchSecretStore } from './ResearchSecretStore'

describe('research adapters', () => {
  const originalDomParser = globalThis.DOMParser

  beforeAll(() => {
    Object.defineProperty(globalThis, 'DOMParser', {
      configurable: true,
      writable: true,
      value: XmlDomParser,
    })
  })

  afterAll(() => {
    Object.defineProperty(globalThis, 'DOMParser', {
      configurable: true,
      writable: true,
      value: originalDomParser,
    })
  })

  it('sends a Web of Science Core Collection edition filter', async () => {
    const requestJson = jest.fn().mockResolvedValue({ documents: [] })
    const adapter = getResearchAdapter('wos')

    await adapter?.search(
      { query: 'AI literacy', limit: 20 },
      {
        http: { requestJson } as unknown as ResearchHttpClient,
        secrets: {
          get: (_sourceId: string, fieldId: string) =>
            fieldId === 'api-key' ? 'wos-key' : null,
        } as unknown as ResearchSecretStore,
        settings: {
          enabled: true,
          autoPolicy: 'explicit-only',
          options: { editions: 'WOS+SSCI' },
        } satisfies ResearchSourceSettings,
      },
    )

    expect(requestJson).toHaveBeenCalledTimes(1)
    const [, request] = requestJson.mock.calls[0] as [
      string,
      { url: string; headers: Record<string, string> },
    ]
    const url = new URL(request.url)
    expect(url.searchParams.get('db')).toBe('WOS')
    expect(url.searchParams.get('edition')).toBe('WOS+SSCI')
    expect(url.searchParams.get('q')).toBe('TS=("AI literacy")')
    expect(url.searchParams.get('sortField')).toBe('RS+D')
    expect(request.headers['X-ApiKey']).toBe('wos-key')
  })

  it('uses RISS SPARQL 1.0 regex and parses uppercase XML bindings', async () => {
    const request = jest.fn().mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/xml;charset=utf-8' },
      text: RISS_XML_RESPONSE,
    })
    const adapter = getResearchAdapter('riss')

    const result = await adapter?.search(
      { query: 'AI 청년 관련 논문', limit: 10 },
      {
        http: { request } as unknown as ResearchHttpClient,
        secrets: {} as ResearchSecretStore,
        settings: {
          enabled: true,
          autoPolicy: 'allow',
          options: {},
        },
      },
    )

    expect(request).toHaveBeenCalledTimes(1)
    const [, httpRequest] = request.mock.calls[0] as [string, { url: string }]
    const url = new URL(httpRequest.url)
    const sparql = url.searchParams.get('query') ?? ''
    expect(url.searchParams.get('type')).toBe('Xml')
    expect(sparql).toContain('regex(?title, "[aA][iI]")')
    expect(sparql).toContain('regex(?title, "청년")')
    expect(sparql).not.toContain('CONTAINS')
    expect(sparql).not.toContain('LCASE')
    expect(sparql).not.toContain('"i")')
    expect(result?.records).toHaveLength(1)
    expect(result?.records[0]).toMatchObject({
      title: '청년의 다차원적 고용불안정성이 우울에 미치는 영향',
      url: 'https://www.riss.kr/link?id=T17012287',
      publishedAt: '2024',
      authors: ['이윤정', '김진현'],
      identifiers: {
        sourceId: 'https://data.riss.kr/resource/Thesis/000017012287',
      },
    })
  })

  it('treats the RISS no-result sentence as a valid empty search', async () => {
    const request = jest.fn().mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/xml;charset=utf-8' },
      text: '조회 결과가 없습니다.',
    })
    const adapter = getResearchAdapter('riss')

    const result = await adapter?.search(
      { query: '존재하지않는검색어', limit: 10 },
      {
        http: { request } as unknown as ResearchHttpClient,
        secrets: {} as ResearchSecretStore,
        settings: {
          enabled: true,
          autoPolicy: 'allow',
          options: {},
        },
      },
    )

    expect(result).toEqual({ records: [], warnings: [] })
  })

  it('uses NAVER API HUB first and sends the current authentication headers', async () => {
    const requestJson = jest.fn().mockResolvedValue({ items: [] })
    const adapter = getResearchAdapter('naver')

    await adapter?.search(
      { query: 'AI education', limit: 1 },
      {
        http: { requestJson } as unknown as ResearchHttpClient,
        secrets: naverSecrets(),
        settings: naverSettings('api-hub'),
      },
    )

    expect(requestJson).toHaveBeenCalledTimes(1)
    const [, request] = requestJson.mock.calls[0] as [
      string,
      { url: string; headers: Record<string, string> },
    ]
    expect(request.url).toContain(
      'https://naverapihub.apigw.ntruss.com/search/v1/news?',
    )
    expect(request.headers).toEqual({
      'X-NCP-APIGW-API-KEY-ID': 'naver-id',
      'X-NCP-APIGW-API-KEY': 'naver-secret',
    })
  })

  it('supports an explicitly selected legacy NAVER Developers application', async () => {
    const requestJson = jest.fn().mockResolvedValue({ items: [] })
    const adapter = getResearchAdapter('naver')

    const result = await adapter?.search(
      { query: 'AI education', limit: 1 },
      {
        http: { requestJson } as unknown as ResearchHttpClient,
        secrets: naverSecrets(),
        settings: naverSettings('legacy-developers'),
      },
    )

    const [, request] = requestJson.mock.calls[0] as [
      string,
      { url: string; headers: Record<string, string> },
    ]
    expect(request.url).toContain(
      'https://openapi.naver.com/v1/search/news.json?',
    )
    expect(request.headers).toEqual({
      'X-Naver-Client-Id': 'naver-id',
      'X-Naver-Client-Secret': 'naver-secret',
    })
    expect(result?.warnings.join(' ')).toContain('legacy NAVER Developers')
  })

  it('auto-detects a legacy NAVER key pair after API HUB rejects it', async () => {
    const requestJson = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(
          'naver: NAVER API HUB authentication failed. Provider errorCode 200 is an authentication error.',
        ),
      )
      .mockResolvedValueOnce({ items: [] })
    const adapter = getResearchAdapter('naver')

    const result = await adapter?.search(
      { query: 'AI education', limit: 1 },
      {
        http: { requestJson } as unknown as ResearchHttpClient,
        secrets: naverSecrets(),
        settings: naverSettings('auto'),
      },
    )

    expect(requestJson).toHaveBeenCalledTimes(2)
    const [, legacyRequest] = requestJson.mock.calls[1] as [
      string,
      { url: string },
    ]
    expect(legacyRequest.url).toContain('https://openapi.naver.com/')
    expect(result?.warnings.join(' ')).toContain('2027-06-30')
  })

  it('explains when both NAVER credential services reject the key pair', async () => {
    const requestJson = jest
      .fn()
      .mockRejectedValue(
        new Error(
          'naver: Authentication or entitlement was rejected. {"errorCode":"024"}',
        ),
      )
    const adapter = getResearchAdapter('naver')

    await expect(
      adapter?.search(
        { query: 'AI education', limit: 1 },
        {
          http: { requestJson } as unknown as ResearchHttpClient,
          secrets: naverSecrets(),
          settings: naverSettings('auto'),
        },
      ),
    ).rejects.toThrow('rejected by both API HUB and the legacy Developers API')
    expect(requestJson).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['without a key', null, false],
    ['with a key', 'openalex-key', true],
  ])('searches OpenAlex %s', async (_label, key, sendsKey) => {
    const requestJson = jest
      .fn()
      .mockResolvedValue({ results: [], meta: { next_cursor: null } })
    const adapter = getResearchAdapter('openalex')

    await adapter?.search(
      { query: 'knowledge management', limit: 5 },
      {
        http: { requestJson } as unknown as ResearchHttpClient,
        secrets: { get: () => key } as unknown as ResearchSecretStore,
        settings: { enabled: true, autoPolicy: 'allow', options: {} },
      },
    )

    const [, sent] = requestJson.mock.calls[0] as [string, { url: string }]
    expect(new URL(sent.url).searchParams.has('api_key')).toBe(sendsKey)
  })

  // Payloads below are verbatim captures from open.kci.go.kr (2026-09-17).
  it('returns no records when KCI reports an empty result set', async () => {
    const request = jest.fn().mockResolvedValue({ text: KCI_NO_DATA_XML })
    const adapter = getResearchAdapter('kci')

    const outcome = await adapter?.search(
      { query: 'vocabulary levels CEFR wordlist', limit: 10 },
      {
        http: { request } as unknown as ResearchHttpClient,
        secrets: { get: () => 'kci-key' } as unknown as ResearchSecretStore,
        settings: { enabled: true, autoPolicy: 'explicit-only', options: {} },
      },
    )

    expect(outcome?.records).toHaveLength(0)
    expect(outcome?.warnings).toContain('No Data')
    expect(outcome?.nextCursor).toBeUndefined()
  })

  it('searches the KCI keyword field and pages without displayCount', async () => {
    const request = jest.fn().mockResolvedValue({ text: KCI_NO_DATA_XML })
    const adapter = getResearchAdapter('kci')

    await adapter?.search(
      { query: '어휘 학습', limit: 25 },
      {
        http: { request } as unknown as ResearchHttpClient,
        secrets: { get: () => 'kci-key' } as unknown as ResearchSecretStore,
        settings: { enabled: true, autoPolicy: 'explicit-only', options: {} },
      },
    )

    const [, sent] = request.mock.calls[0] as [string, { url: string }]
    const url = new URL(sent.url)
    expect(url.searchParams.get('keyword')).toBe('어휘 학습')
    expect(url.searchParams.get('title')).toBeNull()
    expect(url.searchParams.get('page')).toBe('1')
    expect(url.searchParams.has('displayCount')).toBe(false)
  })

  it('honours the KCI title-only search option', async () => {
    const request = jest.fn().mockResolvedValue({ text: KCI_NO_DATA_XML })
    const adapter = getResearchAdapter('kci')

    await adapter?.search(
      { query: '어휘연구의 현황과 전망', limit: 10 },
      {
        http: { request } as unknown as ResearchHttpClient,
        secrets: { get: () => 'kci-key' } as unknown as ResearchSecretStore,
        settings: {
          enabled: true,
          autoPolicy: 'explicit-only',
          options: { 'search-field': 'title' },
        },
      },
    )

    const [, sent] = request.mock.calls[0] as [string, { url: string }]
    expect(new URL(sent.url).searchParams.get('title')).toBe(
      '어휘연구의 현황과 전망',
    )
  })

  it('reads the KCI article id from the articleInfo attribute', async () => {
    const request = jest.fn().mockResolvedValue({ text: KCI_RECORD_XML })
    const adapter = getResearchAdapter('kci')

    const outcome = await adapter?.search(
      { query: '어휘', limit: 10 },
      {
        http: { request } as unknown as ResearchHttpClient,
        secrets: { get: () => 'kci-key' } as unknown as ResearchSecretStore,
        settings: { enabled: true, autoPolicy: 'explicit-only', options: {} },
      },
    )

    expect(outcome?.records).toHaveLength(1)
    const [record] = outcome?.records ?? []
    expect(record.identifiers.kciId).toBe('ART002967395')
    expect(record.identifiers.doi).toBe('10.14817/jlak.2023.76.39')
    expect(record.title).toBe('語彙研究の現状と展望')
    expect(record.url).toBe('https://www.kci.go.kr/kciportal/ci/sereArticle')
    expect(record.publicationName).toBe('일본어학연구')
    expect(outcome?.nextCursor).toBe('2')
  })
})

const RISS_XML_RESPONSE = `<?xml version='1.0'?>
<sparql xmlns='http://www.w3.org/2005/sparql-results#'>
  <head>
    <variable name="LOCATOR"/>
    <variable name="CREATOR"/>
    <variable name="PUBLISHED"/>
    <variable name="WORK"/>
    <variable name="TITLE"/>
  </head>
  <results>
    <result>
      <binding name="LOCATOR"><literal>http://www.riss.kr/link?id=T17012287</literal></binding>
      <binding name="CREATOR"><literal>이윤정</literal></binding>
      <binding name="PUBLISHED"><literal>2024</literal></binding>
      <binding name="WORK"><uri>https://data.riss.kr/resource/Thesis/000017012287</uri></binding>
      <binding name="TITLE"><literal>청년의 다차원적 고용불안정성이 우울에 미치는 영향</literal></binding>
    </result>
    <result>
      <binding name="LOCATOR"><literal>http://www.riss.kr/link?id=T17012287</literal></binding>
      <binding name="CREATOR"><literal>김진현</literal></binding>
      <binding name="PUBLISHED"><literal>2024</literal></binding>
      <binding name="WORK"><uri>https://data.riss.kr/resource/Thesis/000017012287</uri></binding>
      <binding name="TITLE"><literal>청년의 다차원적 고용불안정성이 우울에 미치는 영향</literal></binding>
    </result>
  </results>
</sparql>`

function naverSecrets(): ResearchSecretStore {
  return {
    get: (_sourceId: string, fieldId: string) =>
      fieldId === 'key-id' ? 'naver-id' : 'naver-secret',
  } as unknown as ResearchSecretStore
}

function naverSettings(
  credentialService: 'auto' | 'api-hub' | 'legacy-developers',
): ResearchSourceSettings {
  return {
    enabled: true,
    autoPolicy: 'allow',
    options: {
      'credential-service': credentialService,
      vertical: 'news',
    },
  }
}

const KCI_NO_DATA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaData>
  <inputData><key>k</key><apiCode>articleSearch</apiCode></inputData>
  <outputData>
    <result>
      <resultMsg>No Data</resultMsg>
    </result>
  </outputData>
</MetaData>`

const KCI_RECORD_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaData>
  <inputData><key>k</key><apiCode>articleSearch</apiCode></inputData>
  <outputData>
    <result><total>10594</total></result>
    <record>
      <journalInfo>
        <journal-name>일본어학연구</journal-name>
        <pub-year>2023</pub-year>
      </journalInfo>
      <articleInfo article-id="ART002967395">
        <title-group>
          <article-title lang="original">語彙研究の現状と展望</article-title>
          <article-title lang="foreign">어휘연구의 현황과 전망</article-title>
        </title-group>
        <author-group><author english="Lee, Ja-Ho">이자호(경북대학교)</author></author-group>
        <doi>http://dx.doi.org/10.14817/jlak.2023.76.39</doi>
        <url>https://www.kci.go.kr/kciportal/ci/sereArticle</url>
      </articleInfo>
    </record>
  </outputData>
</MetaData>`
