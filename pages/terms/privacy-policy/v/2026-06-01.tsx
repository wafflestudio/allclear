import { Metadata, NextPage } from 'next'
import PrivacyContactSectionKr from '../../privacy-contact-section-kr'

const renderContent = (content: string) => {
  const tablePattern = /(\|[^\n]+\|\n\|[\s-|]+\|\n(?:\|[^\n]+\|\n?)+)/g
  const parts = content.split(tablePattern)

  return parts.map((part, index) => {
    if (part.startsWith('|') && part.includes('---')) {
      const lines = part.trim().split('\n')
      const headers = lines[0]
        .split('|')
        .filter((cell) => cell.trim())
        .map((cell) => cell.trim())
      const rows = lines.slice(2).map((line) =>
        line
          .split('|')
          .filter((cell) => cell.trim())
          .map((cell) => cell.trim()),
      )

      return (
        <div key={index} className=" overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                {headers.map((header, i) => (
                  <th key={i} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    return part ? (
      <span key={index} className="whitespace-pre-wrap">
        {part}
      </span>
    ) : null
  })
}

const privacyPolicyKr: { title: string; content: string }[] = `총칙

WaffleStudio는 올클 및 관련 제반 서비스(이하 “서비스”라고 합니다)를 이용하는 회원의 개인정보 보호를 소중하게 생각하고, 회원의 개인정보를 보호하기 위하여 항상 최선을 다해 노력하고 있습니다.
WaffleStudio는 개인정보 보호 관련 주요 법률인 개인정보 보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 “정보통신망법”이라고 합니다.)을 비롯한 모든 개인정보 보호에 관련 법률 규정 및 국가기관 등이 제정한 고시, 훈령, 지침 등을 준수합니다.

본 개인정보취급방침은 서비스를 이용하는 회원에 대하여 적용되며, 회원이 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위하여 어떠한 조처를 취하고 있는지 알립니다.

### 개인정보의 수집·이용에 대한 동의

적법하고 공정한 방법에 의하여 서비스 이용계약의 성립 및 이행에 필요한 최소한의 개인정보를 수집하며 이용자의 개인 식별이 가능한 개인정보를 수집하기 위하여 회원가입시 개인정보수집·이용 동의에 대한 내용을 제공하고 회원이 '동의' 버튼을 클릭하면 개인정보 수집·이용에 대해 동의한 것으로 봅니다.

### 개인정보의 수집범위 및 수집방법

1. WaffleStudio는 회원가입 등 서비스 제공 및 계약이행을 위해 아래와 같이 개인정보를 수집할 수 있습니다.
- [필수] 이메일 주소, SNS 계정 연동 정보(카카오톡, 애플), 이름, 연락처
- [선택] 아이디, 비밀번호, 생년월일, 성별, 학교, 학과, 학번, 졸업일자, 프로필 사진

2. 서비스 이용과정에서 아래와 같은 정보들이 생성되어 수집될 수 있습니다.
(1) PC : PC MacAddress, PC 사양정보, 브라우저 정보, 기타 서비스 이용 시 사용되는 프로그램 버전 정보
(2) 휴대전화(스마트폰) & 스마트OS 탑재 모바일 기기(Tablet PC 등) : 모델명, 기기별 고유번호(UDID,IMEI 등), OS정보, 이동통신사, 구글/애플 광고 ID
(3) 기타 정보 : 서비스 이용(정지) 기록, 접속 로그, 쿠키, 접속 IP정보, 기타 회원이 입력한 정보

3. WaffleStudio는 다음과 같은 방식으로 개인정보를 수집합니다.
(1) 회원이 직접 등록한 개인 정보
(2) SNS 연동 시 제3자 계정에 등록한 개인 정보

4. 기본적 인권침해의 우려가 있는 개인정보(인종 및 민족, 사상 및 신조, 출신지 및 본적지, 정치적 성향 및 범죄기록, 건강상태 및 성생활 등)는 요구하지 않으며, 위의 항목 이외에 다른 어떠한 목적으로도 수집, 사용하지 않습니다.

### 개인정보의 수집목적 및 이용목적

WaffleStudio는 수집한 개인정보를 다음의 목적으로 활용합니다.

1. 회원관리
회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 중복가입확인, 가입의사 확인

2. 서비스 품질 향상을 목적으로 활용
신규 서비스 개발, 서비스 유효성 확인, 접속 빈도 파악, 회원의 서비스 이용에 대한 통계

### 수집한 개인정보의 취급 위탁

WaffleStudio는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.

| 위탁받는 자(수탁자) | 위탁업무 |
| --- | --- |
| Oracle Corporation | 클라우드 인프라 제공 및 데이터 보관 |
| Google LLC | 서비스 이용 통계 분석 (Google Analytics) |

WaffleStudio는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.
개인정보 처리 업무를 국외에 위탁하는 경우는 아래 '개인정보의 국외 이전에 관한 사항'에서 안내하고 있습니다.

### 개인정보의 자동 수집 장치의 설치, 운영 및 그 거부에 관한 사항

1. 앱 서비스에서의 자동 수집

WaffleStudio는 서비스 품질 향상을 위해 Google이 제공하는 분석 서비스인 Google Analytics(Firebase)를 사용하여 서비스 이용 통계를 수집하고 있습니다. 이를 통해 앱 인스턴스 ID, 접속 IP, 기기 정보(OS, 모델명 등), 서비스 이용 기록 등이 자동으로 수집됩니다.

수집된 정보는 서비스 이용 현황 분석, 서비스 개선 및 품질 향상 목적으로만 활용되며, 개인을 식별할 수 있는 정보와 결합하지 않습니다.

이용자는 앱 내 설정에서 '서비스 이용 통계 수집' 항목을 비활성화하여 수집을 거부할 수 있으며, 이 경우 서비스 이용에는 영향이 없습니다.

Google Analytics를 통한 국외 이전에 관한 상세사항은 '개인정보의 국외 이전에 관한 사항'에서 안내하고 있습니다.

2. 웹사이트에서의 쿠키 사용

WaffleStudio는 웹사이트(all-clear.cc) 운영 시 이용자의 편의를 위해 쿠키(Cookie)를 사용할 수 있습니다. 쿠키란 웹 서버가 이용자의 브라우저에 보내는 소량의 텍스트 파일로, 이용자의 기기에 저장됩니다.

회원은 쿠키 설치에 대한 선택권을 가지고 있으며 회원은 웹브라우저에서 옵션을 설정함으로서 모든 쿠키를 허용하거나, 또는 쿠키가 저장될 때마다 확인을 거치거나, 혹은 모든 쿠키의 저장을 거부할 수도 있습니다. 다만, 회원님께서 쿠키 설치를 거부했을 경우 서비스 제공에 어려움이 발생할 수도 있습니다.

### 개인정보의 국외 이전에 관한 사항

WaffleStudio는 서비스 이용자로부터 수집한 개인정보를 아래와 같이 국외에 이전하고 있으며, 「개인정보 보호법」 제28조의8제2항에 따라 국외이전에 대해 다음과 같이 안내합니다.

1. Google Analytics를 통한 국외 이전

| 항목 | 내용 |
| --- | --- |
| 국외이전의 법적 근거 | 「개인정보 보호법」 제28조의8제1항제3호 (계약 이행을 위한 국외 처리위탁) |
| 이전되는 개인정보 항목 | 앱 인스턴스 ID, 접속 IP, 기기 정보(OS, 모델명 등), 서비스 이용 기록 |
| 이전 국가 | 미국 |
| 이전 시기 및 방법 | 서비스 이용 시점에 자동으로 네트워크를 통해 전송 |
| 이전받는 자 | Google LLC (https://support.google.com/analytics/answer/7518141) |
| 이용 목적 | 서비스 이용 통계 분석 및 품질 향상 |
| 보유·이용 기간 | 이벤트 데이터 2개월, 사용자 데이터 14개월 |

Google Analytics를 통한 개인정보 수집을 거부하고자 하는 경우, 앱 내 설정에서 데이터 수집을 거부하거나, 기기 설정에서 광고 추적을 제한할 수 있습니다. 이 경우 서비스 이용에는 영향이 없습니다.

Google Analytics를 통해 수집되는 정보의 처리는 아래 정책을 따릅니다.

- Google 개인정보처리방침: https://www.google.com/intl/ko/policies/privacy
- Google Analytics 이용약관: https://www.google.com/analytics/terms/kr.html

### 개인정보의 공유 및 제공

1. WaffleStudio는 회원의 개인정보를 본 개인정보취급방침에서 명시된 범위를 초과하여 이용하거나 제 3자(타인 또는 타기업 기관)에 제공하지 않습니다. 다만, 회원의 동의가 있거나 다음 각호의 어느 하나에 해당하는 경우에는 예외로 합니다.
(1) 서비스 제공에 따른 요금 정산을 위하여 필요한 경우
(2) 관계법령에 의하여 수사, 재판 또는 행정상의 목적으로 관계기관으로부터 요구가 있을 경우
(3) 통계작성, 학술연구나 시장조사를 위하여 특정 개인을 식별할 수 없는 형태로 가공하여 제공하는 경우
(4) 금융실명거래및비밀보장에관한법률, 신용정보의이용및보호에관한법률, 전기통신기본법, 전기통신사업법, 지방 세법, 소비자보호법, 한국은행법, 형사소송법 등 기타 관계법령에서 정한 절차에 따른 요청이 있는 경우

2. 영업의 전부 또는 일부를 양도하거나, 합병/상속 등으로 서비스제공자의 권리,의무를 이전 승계하는 경우 개인 정보보호 관련 회원의 권리를 보장하기 위하여 반드시 그 사실을 회원에게 통지합니다.

### 개인정보의 보관기간 및 이용기간

1. 이용자의 개인정보는 개인정보의 수집목적 또는 제공받은 목적이 달성되면 파기됩니다. 회원이 회원탈퇴를 하거나 개인정보 허위기재로 인해 회원 ID 삭제 처분을 받은 경우 수집된 개인정보는 완전히 삭제되며 어떠한 용도로도 이용할 수 없도록 처리됩니다.

2. 이용자의 개인정보는 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기되나, 아래 각 항목에 해당하는 경우에는 명시한 기간 동안 보관할 수 있으며, 그 외 다른 목적으로는 사용하지 않습니다.

(1) 불건전한 서비스 이용으로 서비스에 물의를 일으킨 이용자의 경우 사법기관 수사의뢰를 하거나 다른 회원을 보호할 목적으로 1년간 해당 개인정보를 보관할 수 있습니다.

(2) 관계법령의 규정에 의하여 보관할 필요가 있는 경우 WaffleStudio는 수집 및 이용 목적 달성 후에도 관계법령 에서 정한 일정 기간 동안 회원의 개인정보를 보관할 수 있습니다.
가. 계약 또는 청약철회 등에 관한 기록 : 5년
나. 대금결제 및 재화의 공급에 관한 기록 : 5년
다. 소비자의 불만 또는 분쟁처리에 관한 기록 : 3년
라. 표시, 광고에 관한 기록 : 1년
마. 웹사이트 방문기록 : 1년

### 회원의 권리와 의무

회원은 본인의 개인정보를 최신의 상태로 정확하게 입력하여 불의의 사고를 예방해주시기 바랍니다. 이용자가 입력한 부정확한 정보로 인해 발생하는 사고의 책임은 이용자 자신에게 있으며 타인 정보의 도용 등 허위정보를 입력 할 경우 계정의 이용이 제한될 수 있습니다.
WaffleStudio가 운영하는 서비스를 이용하는 회원은 개인정보를 보호 받을 권리와 함께 스스로를 보호하고 타인의 정보를 침해하지 않을 의무도 가지고 있습니다. 회원은 아이디(ID), 비밀번호를 포함한 개인정보가 유출되지 않도록 조심 하여야 하며, 게시물을 포함한 타인의 개인정보를 훼손하지 않도록 유의해야 합니다. 만약 이 같은 책임을 다하지 못하고 타인의 정보 및 타인의 존엄성을 훼손할 경우에는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」등에 의해 처벌 받을 수 있습니다.

### 고지의 의무

현 「개인정보취급방침」 내용의 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일 전부터 앱 내 알림을 통해 고지하고, 개정 내용이 이용자에게 불리할 경우에는 30일간 고지할 것입니다.`
  .trim()
  .split('###')
  .map((it) => {
    const [title, ...content] = it.trim().split('\n\n')
    return { title: title.trim(), content: content.join('\n\n').trim() }
  })

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  openGraph: {
    title: '개인정보 처리방침',
    description: '올클 개인정보 처리방침',
    images: ['/images/share-logo.png'],
  },
}

const PrivacyPolicy: NextPage = () => {
  return (
    <>
      <main className="bg-white pb-16 pt-8 text-gray-900 lg:pb-24 lg:pt-16">
        <div className="mx-auto flex max-w-screen-xl flex-col justify-between px-4">
          <article className="format format-sm sm:format-base lg:format-lg format-blue mx-auto w-full max-w-2xl whitespace-pre-wrap">
            <header className="not-format mb-4 lg:mb-6">
              <address className="mb-6 flex items-center not-italic">
                <div className="mr-3 inline-flex items-center text-sm text-gray-900">
                  <div>
                    <span className="text-xl font-bold text-gray-900">올클</span>
                    <p className="text-base font-light text-gray-500">
                      우리학교 모든 동아리, 한 번에 올클하자!
                    </p>
                    <p className="text-base font-light text-gray-500"></p>
                  </div>
                </div>
              </address>
              <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl">
                개인정보 처리방침
              </h1>
            </header>
            <p className="lead prose mb-4">
              {`WaffleStudio는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.`}
            </p>
            <ol className="list-outside ">
              {privacyPolicyKr.map((it) => (
                <section key={it.title} className="mb-8">
                  <li className="mb-4">
                    <h2 className="mb-2 text-xl font-semibold">{it.title}</h2>
                    <div className="prose">{renderContent(it.content)}</div>
                  </li>
                </section>
              ))}
            </ol>
            <PrivacyContactSectionKr />
          </article>
        </div>
      </main>

      <footer className="bg-gray-50">
        <div className="mx-auto max-w-screen-xl p-4 py-6 md:p-8 lg:p-10">
          <div className="text-center">
            <span className="block text-center text-sm text-gray-500">
              © 2026{' '}
              <a href="#" className="hover:underline">
                WaffleStudio
              </a>
              . All Rights Reserved.
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}

export default PrivacyPolicy
