dooi-mcp/
├─ package.json
├─ tsconfig.json
├─ mcp-manifest.json
├─ .gitignore
├─ .env.example
├─ README.md
└─ src/
   ├─ server.ts
   ├─ adapters/
   │  └─ mcp/
   │     ├─ transport.ts          # Stdio transport 래퍼
   │     ├─ schema.ts             # Zod 스키마(툴 입출력 공통)
   │     └─ responders.ts         # tools/resources/prompts 등록/핸들러 바인딩
   ├─ capabilities/
   │  ├─ tools/
   │  │  ├─ index.ts              # 이름→핸들러 매핑 및 export
   │  │  ├─ list.ts               # dooi.list
   │  │  ├─ fetch.ts              # dooi.fetch
   │  │  ├─ resolveUses.ts        # dooi.resolve.uses
   │  │  ├─ fetchBatch.ts         # dooi.fetchBatch
   │  │  ├─ install.ts            # dooi.install
   │  │  ├─ textEdit.ts           # dooi.textEdit
   │  │  ├─ installDeps.ts        # dooi.installDeps
   │  │  └─ workflow/
   │  │     ├─ applyComponent.ts  # dooi.workflow.applyComponent
   │  │     ├─ applyTemplate.ts   # dooi.workflow.applyTemplate
   │  │     └─ common.ts          # 공통 단계/검증/롤백 훅
   │  ├─ resources/
   │  │  ├─ index.ts              # 리소스 라우팅
   │  │  ├─ catalog.ts            # mcp://dooi/catalog
   │  │  ├─ stageTree.ts          # mcp://dooi/stage/{t}/tree
   │  │  └─ stageMeta.ts          # mcp://dooi/stage/{t}/meta
   │  └─ prompts/
   │     ├─ index.ts
   │     ├─ quick_start.prompt.md       # dooi/quick_start
   │     ├─ plan_install.prompt.md      # dooi/plan_install
   │     └─ generate_text_edits.prompt.md # dooi/generate_text_edits
   ├─ core/
   │  ├─ stage.ts                # 임시 디렉토리/토큰 관리
   │  ├─ copy.ts                 # glob 플랜 + pathMap + 복사 로직
   │  ├─ deps.ts                 # npm|yarn|pnpm 실행기
   │  ├─ exec.ts                 # execa 래퍼(타임아웃/로그/에러 표준화)
   │  ├─ guards.ts               # 경로 탈출 방지/권한 체크
   │  ├─ errors.ts               # 에러 코드/헬퍼
   │  ├─ logger.ts               # stderr 전용 로거
   │  ├─ types.ts                # EditPlan/CopyAction 등 공통 타입
   │  ├─ config/
   │  │  ├─ defaults.ts          # 기본 확장자/옵션/폴리시
   │  │  └─ pathStrategies/
   │  │     ├─ next-app.ts       # app/, src/components/* 배치 규칙
   │  │     └─ vite-react.ts     # 대안 전략(선택)
   │  └─ parse/
   │     ├─ cliOutput.ts         # `npx dooi-ui get` stdout 메타 파서
   │     └─ uses.ts              # import 스캔으로 uses 추론
   └─ edits/
      ├─ astText.ts              # JSXText/StringLiteral/TemplateElement 치환
      ├─ plainText.ts            # 평문 치환
      └─ apply.ts                # EditPlan 실행(확장자 라우팅/드라이런/리포트)
