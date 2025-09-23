# LLM 사용 가이드 - DooiUI MCP 서버

## 🎯 **LLM이 사용하기 쉬운 방식**

LLM이 dooi 컴포넌트를 설치할 때는 다음과 같은 단계로 진행하면 됩니다:

### **1단계: 사용 가능한 컴포넌트 확인**
```json
{
  "name": "dooi.list",
  "arguments": {}
}
```

### **2단계: 원하는 컴포넌트/템플릿 선택**
```json
{
  "name": "dooi.fetch", 
  "arguments": {
    "id": "ui/fluid-blob"
  }
}
```

### **3단계: 컴포넌트 설치**
```json
{
  "name": "dooi.install",
  "arguments": {
    "stageDir": "이전 단계에서 받은 stageDir",
    "destRoot": "/path/to/project",
    "pathMap": {
      "ui/": "src/components/ui/"
    }
  }
}
```

### **4단계: 의존성 설치**
```json
{
  "name": "dooi.installDeps",
  "arguments": {
    "destRoot": "/path/to/project",
    "packages": ["three", "@react-three/fiber"]
  }
}
```

## 🚀 **더 간단한 방법 (워크플로우 도구)**

### **컴포넌트 설치**
```json
{
  "name": "dooi.workflow.applyComponent",
  "arguments": {
    "id": "ui/fluid-blob",
    "destRoot": "/path/to/project"
  }
}
```

### **템플릿 설치**
```json
{
  "name": "dooi.workflow.applyTemplate", 
  "arguments": {
    "id": "landing-morphic",
    "destRoot": "/path/to/project"
  }
}
```

## 💡 **LLM이 고려해야 할 점**

1. **컴포넌트 타입별 경로 매핑**:
   - `ui/` → `src/components/ui/`
   - `Hero/` → `src/components/Hero/`
   - `Cards/` → `src/components/Cards/`

2. **프로젝트 구조 감지**:
   - Next.js: `src/` 디렉토리 사용
   - Vite: `src/` 디렉토리 사용
   - 일반 React: `src/` 디렉토리 사용

3. **의존성 관리**:
   - Three.js 컴포넌트: `three`, `@react-three/fiber`
   - 애니메이션 컴포넌트: `framer-motion`

## 🎨 **사용 예시**

### **사용자가 "3D 애니메이션 배경을 만들어줘"라고 요청한 경우**

1. **컴포넌트 목록 확인**:
```json
{"name": "dooi.list", "arguments": {}}
```

2. **적절한 컴포넌트 선택** (예: `ui/fluid-blob`):
```json
{
  "name": "dooi.fetch",
  "arguments": {"id": "ui/fluid-blob"}
}
```

3. **컴포넌트 설치**:
```json
{
  "name": "dooi.install",
  "arguments": {
    "stageDir": "받은_stageDir",
    "destRoot": "/current/project",
    "pathMap": {"ui/": "src/components/ui/"}
  }
}
```

4. **의존성 설치**:
```json
{
  "name": "dooi.installDeps",
  "arguments": {
    "destRoot": "/current/project",
    "packages": ["three", "@react-three/fiber"]
  }
}
```

## 🔧 **고급 사용법**

### **브랜드 커스터마이징**
```json
{
  "name": "dooi.textEdit",
  "arguments": {
    "destRoot": "/path/to/project",
    "include": ["**/*.tsx", "**/*.ts"],
    "replacements": [
      {"find": "Brand", "replaceWith": "MyCompany"}
    ]
  }
}
```

### **복잡한 템플릿 설치**
템플릿이 여러 컴포넌트를 사용하는 경우, 워크플로우 도구가 자동으로 처리합니다.

## 📝 **LLM을 위한 팁**

1. **항상 `dooi.list`로 시작**해서 사용 가능한 옵션을 확인하세요
2. **사용자 요청에 맞는 컴포넌트를 선택**하세요
3. **프로젝트 구조에 맞는 경로 매핑**을 설정하세요
4. **의존성을 반드시 설치**하세요
5. **워크플로우 도구를 사용하면** 대부분의 단계가 자동화됩니다
