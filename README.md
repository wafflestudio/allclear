# AllClear App

## 📋 목차

- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [아키텍처](#-아키텍처)
- [자체 ORM](#-자체-orm)
- [데이터 플로우](#-데이터-플로우)
- [웹뷰 기능](#-웹뷰-기능)
- [개발 가이드](#-개발-가이드)
- [빌드 및 배포](#-빌드-및-배포)

## 🗂️ 프로젝트 구조

**Clean Architecture 기반 4계층 구조로 Entity-Repository-UseCase-Presentation 패턴 적용**

```
src/
├── assets/             # 이미지, 아이콘 등 정적 리소스
├── config/             # 환경변수 설정
├── entities/           # 도메인 타입 정의
├── features/           # 도메인별 화면 구성
├── repositories/       # 데이터 계층 (자체 ORM)
├── shared/             # 공통 컴포넌트/상수/컨텍스트/훅/유틸
├── tabs/               # 탭 네비게이션 구성
└── usecases/           # 비즈니스 로직
```

### 주요 파일 구조

- `entities/`: user.ts, club.ts, review.ts, category.ts
- `repositories/`: 각 도메인별 CRUD + API 통신
- `usecases/`: 비즈니스 로직 + Repository DI
- `features/`: club, home, mypage, webview 화면 도메인
- `shared/contexts/serviceContext.ts`: 전체 서비스 의존성 주입
- `shared/utils/api.ts`: APIConnector 클래스 (HTTP 클라이언트)

## 🚀 시작하기

**Node.js 22.13+ 및 pnpm 환경에서 React Native 앱 실행**

### 설치 및 실행

```bash
# 의존성 설치
pnpm install && cd ios && pod install && cd ..

# 개발 서버 실행
pnpm start
pnpm ios:local      # iOS
pnpm android:debug  # Android
```

### 환경 변수 설정

`.env.local`, `.env.prod` 파일에 설정:

```env
API_SERVER_BASE_URL=https://your-api-server.com
PROFILE=dev|staging|prod
```

## 🏛️ 아키텍처

**Clean Architecture 4계층으로 의존성 역전과 계층 분리 달성**

```
┌─────────────────┐
│   Presentation  │ ← features/, shared/, tabs/ (UI + 상태)
├─────────────────┤
│    Use Cases    │ ← usecases/ (비즈니스 로직)
├─────────────────┤
│   Repositories  │ ← repositories/ (데이터 접근)
├─────────────────┤
│    Entities     │ ← entities/ (도메인 모델)
└─────────────────┘
```

### 계층별 역할

**1. Entities** - 순수 TypeScript 타입

```typescript
export type User = {
	id: string
	nickname: string
	college: string // 단과대
	major: string // 학과
	grade: number | null
}
```

**2. Repositories** - 데이터 추상화 + 자체 ORM

```typescript
export const getUserRepository = (): UserRepository => ({
	getUser: async () => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN)
		return apiConnector.get<GetUserResponse>('/v1/users/me')
	},
})
```

**3. Use Cases** - 비즈니스 로직 + DI

```typescript
export const getUserService = ({ repositories }: Deps): UserService => ({
	getUser: () => repositories[0].getUser(),
})
```

**4. Presentation** - UI + 이벤트 로깅

```typescript
const HomeScreen = () => {
  const { logClickEvent } = useClickEventLog()
  return (
    <WithViewEventLog params={{ screen_name: 'home_screen' }}>
      {/* UI 컴포넌트 */}
    </WithViewEventLog>
  )
}
```

## 🗄️ 자체 ORM

**TypeScript + Repository 패턴으로 별도 ORM 라이브러리 없이 타입 안전한 데이터 계층 구현**

### 1. APIConnector 클래스

```typescript
export class APIConnector {
	async get<T>(path: string, params?: any): Promise<T> {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN)
		const headers = token ? { Authorization: `Bearer ${token}` } : {}
		return this.request(path, 'GET', { params, headers })
	}
}

export const apiConnector = new APIConnector()
```

### 2. Repository 패턴

```typescript
// 인터페이스 정의
export type ClubRepository = {
	searchClubs: (req: SearchClubsRequest) => Promise<SearchClubsResponse>
	getClub: (req: GetClubRequest) => Promise<Club>
}

// 구현체
export const getClubRepository = (): ClubRepository => ({
	searchClubs: async req => apiConnector.get(`/v1/clubs/search`, req),
	getClub: async req => apiConnector.get(`/v1/clubs/${req.uuid}`),
})
```

### 3. 타입 안전성

모든 Request/Response에 TypeScript 타입 정의로 컴파일타임 검증

**장점**: 타입 안전성 + 경량화 + 테스트 용이성 + 명확한 계층 분리

## 🔄 데이터 플로우

**App.tsx에서 전체 의존성 주입 후 Context로 전파하는 구조**

### 의존성 주입 패턴

```typescript
// App.tsx
function App() {
  // 1. Repository 생성
  const userRepository = getUserRepository()
  const clubRepository = getClubRepository()

  // 2. Service에 Repository 주입
  const userService = getUserService({ repositories: [userRepository] })
  const clubService = getClubService({ repositories: [clubRepository] })

  // 3. Context로 서비스 제공
  const services = { userService, clubService }

  return (
    <ServiceProvider value={services}>
      <ProfileProvider>
        {/* 앱 컴포넌트 */}
      </ProfileProvider>
    </ServiceProvider>
  )
}
```

### 컴포넌트에서 사용

```typescript
export const ProfileProvider = ({ children }) => {
  const { userService } = useContext(serviceContext)

  useEffect(() => {
    userService.getUser().then(setUser)
  }, [])

  return <profileContext.Provider value={{ user }}>{children}</profileContext.Provider>
}
```

## 🌐 웹뷰 기능

**React Native WebView를 활용한 하이브리드 기능 제공**

### 개요

앱 내에서 웹 페이지를 표시할 수 있는 WebView 화면을 제공합니다. 주로 동아리 정보 편집과 같이 복잡한 폼이 필요한 기능을 웹으로 구현하여 앱에서 사용합니다.

### 주요 기능

**1. 인앱 브라우저**

```typescript
// 파일: src/screens/WebviewScreen/index.tsx:12-54
<WebView
  source={{
    uri,
    headers: authorization ? { 'x-authorization': `Bearer ${authorization}` } : {},
  }}
  javaScriptEnabled
  domStorageEnabled
  sharedCookiesEnabled
/>
```

**2. 인증 헤더 지원**

- Authorization 토큰을 `x-authorization` 헤더로 전달
- 로그인이 필요한 웹 페이지 접근 가능

**3. 웹-네이티브 통신**

```typescript
// 웹에서 앱으로 메시지 전송
// 파일: src/screens/WebviewScreen/index.tsx:17-24
const onMessage = (e: WebViewMessageEvent) => {
	const event = JSON.parse(e.nativeEvent.data)

	switch (event.method) {
		case 'CLOSE_WEBVIEW':
			return navigation.goBack()
	}
}
```

**4. 로딩 상태 표시**

- 웹 페이지 로딩 중 ActivityIndicator 표시
- `onLoadStart`, `onLoadEnd` 이벤트로 로딩 상태 관리

**5. 네비게이션**

- 커스텀 헤더 with 뒤로가기 버튼
- 웹에서 `CLOSE_WEBVIEW` 메시지로 화면 닫기 가능

### 사용 예시

**동아리 편집 페이지 열기**

```typescript
// 파일: src/screens/MyPageScreen/index.tsx:69-71
navigation.navigate(SCREEN_TYPE.WEBVIEW, {
	uri: ENV.WEB_URL + '/c/edit/' + club.uuid,
	authorization, // 사용자 토큰
})
```

### 라우트 파라미터

```typescript
// 파일: src/entities/screen.ts:37
type WebViewParams = {
	uri: string // 표시할 웹 페이지 URL
	authorization?: string // 선택적 인증 토큰
}
```

### 웹에서 앱으로 메시지 전송 방법

**웹 페이지에서 다음과 같이 메시지 전송:**

```javascript
// 웹 페이지 JavaScript 코드
window.ReactNativeWebView.postMessage(
	JSON.stringify({
		method: 'CLOSE_WEBVIEW',
	}),
)
```

### 지원 기능

- JavaScript 실행
- DOM Storage
- 쿠키 공유 (앱과 웹 간)
- Third-party 쿠키
- 자동 창 열기
- Bounce 효과 비활성화 (iOS)
- OverScroll 비활성화 (Android)

### 활용 사례

- **동아리 관리**: 동아리 정보 편집 폼 (`/c/edit/:uuid`)
- **복잡한 폼**: 여러 필드와 검증이 필요한 입력 폼
- **외부 연동**: 웹에서만 제공되는 서비스 통합

### 파일 구조

```
src/screens/WebviewScreen/
├── index.tsx           # WebView 메인 화면
└── Header/
    └── index.tsx       # 커스텀 네비게이션 헤더
```

## 🛠️ 개발 가이드

**새 기능 개발 시 Entity → Repository → UseCase → UI 순서로 진행**

### 새 기능 개발 플로우

1. **Entity 타입 정의**

```typescript
export type NewFeature = { id: string; name: string }
```

2. **Repository 구현**

```typescript
export const getNewFeatureRepository = (): NewFeatureRepository => ({
	getFeature: async id => apiConnector.get(`/v1/features/${id}`),
})
```

3. **UseCase 구현**

```typescript
export const getNewFeatureService = ({ repositories }) => ({
	getFeature: id => repositories[0].getFeature(id),
})
```

4. **의존성 주입 + UI 사용**

```typescript
// App.tsx에서 서비스 추가 후 Context에서 사용
const { newFeatureService } = useContext(serviceContext)
```

### 코드 스타일

```bash
pnpm lint       # Biome 검사
pnpm typecheck  # TypeScript 타입 체크
```

### 주요 라이브러리

- **네비게이션**: `@react-navigation/native`
- **상태관리**: `@tanstack/react-query` + React Context
- **UI**: `react-native-elements`, `@gorhom/bottom-sheet`
- **HTTP**: `axios`
- **스토리지**: `@react-native-async-storage/async-storage`
- **로그인**: `@react-native-seoul/kakao-login`, `@invertase/react-native-apple-authentication`

### 테스트 예시

```typescript
const mockRepository: UserRepository = {
	getUser: jest.fn().mockResolvedValue(mockUser),
}
const userService = getUserService({ repositories: [mockRepository] })

test('should get user', async () => {
	const user = await userService.getUser()
	expect(user).toEqual(mockUser)
})
```

### 트러블슈팅

```bash
npx react-native start --reset-cache  # Metro 캐시 클리어
cd ios && pod deintegrate && pod install  # iOS 의존성 재설치
cd android && ./gradlew clean          # Android 클리어
pnpm reset                             # 전체 리셋
```

### 빌드 명령어

```bash
# 디버그
pnpm ios:local / pnpm android:debug

# 릴리스
pnpm build:ios:prod:release / pnpm build:android:release

```

---

## 📋 전체 프로젝트 파일 구조

```
src/
├── assets/                         # 정적 리소스
│   ├── icons/                      # 앱 아이콘 (apple, kakao, trophy 등)
│   └── images/                     # 이미지 리소스 (header, mypage, theme, tab 등)
│
├── config/                         # 환경변수/런타임 설정
│   └── ENV.ts                      # 환경변수 검증 및 관리
│
├── entities/                       # 도메인 모델 (타입 정의)
│   ├── user.ts                     # 사용자 정보 (User, CollegeMajor)
│   ├── club.ts                     # 동아리 정보 (Club, ClubRanking, ReviewKeyword)
│   ├── category.ts                 # 동아리 카테고리 (9개 카테고리별 색상/이미지)
│   ├── review.ts                   # 리뷰 키워드 시스템
│   ├── eventLog.ts                 # 사용자 행동 로깅 (view, click, expose)
│   └── screen.ts                   # React Navigation 스크린 타입
│
├── repositories/                   # 데이터 접근 계층 (자체 ORM)
│   ├── auth.ts                     # 인증 (카카오/애플 로그인, 회원탈퇴)
│   ├── category.ts                 # 카테고리 데이터 관리
│   ├── club.ts                     # 동아리 CRUD (검색, 목록, 상세, 저장, 랭킹)
│   ├── review.ts                   # 리뷰 및 평점 시스템
│   └── user.ts                     # 사용자 관리 (프로필, 피드백, 학과목록)
│
├── features/                       # 도메인별 화면 컴포넌트
│   ├── club/screens/               # 동아리 도메인 화면
│   │   ├── ClubDetailScreen/
│   │   ├── ClubListScreen/
│   │   ├── ClubRankingScreen/
│   │   │   └── RankedClubs/
│   │   ├── ClubReviewScreen/
│   │   └── SearchResultClubListScreen/
│   ├── home/screens/
│   │   └── HomeScreen/             # 홈 화면 (Header, CategoryBoard, RecommendClubs)
│   ├── mypage/screens/
│   │   ├── EditProfileScreen/
│   │   ├── ManageClubListScreen/
│   │   ├── MyPageScreen/
│   │   └── SavedClubListScreen/
│   └── webview/screens/
│       └── WebviewScreen/
│
├── shared/                         # 공통 모듈
│   ├── components/                 # 공통 UI 컴포넌트
│   │   ├── AlertModal.tsx
│   │   ├── Button.tsx
│   │   ├── ClubListItem.tsx
│   │   ├── HeaderProfile.tsx
│   │   ├── HtmlView.tsx
│   │   ├── LoginView.tsx
│   │   ├── ManageClubView.tsx
│   │   ├── TextField.tsx
│   │   └── UserVoiceView.tsx
│   ├── constants/                  # 공통 상수
│   │   ├── colors.ts
│   │   ├── fixtures.ts
│   │   └── localStorage.ts
│   ├── contexts/                   # React Context
│   │   ├── loginBottomSheetContext.tsx
│   │   ├── manageClubBottomSheet.tsx
│   │   ├── profileContext.tsx
│   │   ├── serviceContext.ts
│   │   └── userVoiceBottomSheetContext.tsx
│   ├── hocs/
│   │   └── WithViewEventLog.tsx
│   ├── hooks/
│   │   ├── useClickEventLog.tsx
│   │   └── useExposeEventLog.tsx
│   └── utils/
│       ├── api.ts
│       └── navigation.ts
│
├── tabs/                           # 탭 네비게이션
│   ├── HomeTab.tsx
│   ├── MyPageTab.tsx
│   ├── RankingTab.tsx
│   └── TabNavigator.tsx
│
└── usecases/                       # 비즈니스 로직 계층
    ├── auth.ts                     # 인증 비즈니스 로직
    ├── category.ts                 # 카테고리 비즈니스 로직
    ├── club.ts                     # 동아리 비즈니스 로직
    ├── eventLog.ts                 # 이벤트 로깅 비즈니스 로직
    ├── review.ts                   # 리뷰 비즈니스 로직
    └── user.ts                     # 사용자 비즈니스 로직
```

### 파일 역할 요약

**🔸 Domain Layer (entities/)**  
순수 TypeScript 타입으로 비즈니스 도메인 모델 정의

**🔸 Data Layer (repositories/)**  
API 통신과 데이터 CRUD 담당. 자체 ORM 역할 수행

**🔸 Business Layer (usecases/)**  
Repository를 조합한 비즈니스 로직. 의존성 주입 패턴

**🔸 Presentation Layer (features/, shared/, tabs/)**  
UI 컴포넌트와 전역 상태 관리

**🔸 Infrastructure (config/, shared/)**  
HTTP 클라이언트, 환경설정, 공통 유틸리티

**🔸 Cross-Cutting (hooks/, hocs/)**  
이벤트 로깅 시스템과 재사용 로직
