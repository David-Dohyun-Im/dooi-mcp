# LLM을 위한 간단한 사용 예시

## 🎯 **가장 간단한 방법 (추천)**

### **1단계: 컴포넌트 목록 확인**
```json
{
  "name": "dooi.list",
  "arguments": {}
}
```

### **2단계: 적절한 컴포넌트 선택 후 설치**
```json
{
  "name": "dooi.workflow.applyComponent",
  "arguments": {
    "id": "ui/fluid-blob",
    "destRoot": "/path/to/project"
  }
}
```

**끝!** 🎉

## 🧠 **LLM이 고려해야 할 사용자 요청 패턴**

### **"3D 배경/효과" 요청**
- **추천**: `recommendations.for3D`에서 선택
- **우선순위**: `Hero/FluidBlobDemo` > `ui/fluid-blob`

### **"애니메이션" 요청**  
- **추천**: `recommendations.forAnimation`에서 선택
- **우선순위**: `Cards/ShuffleGridDemo` > `ui/shuffle-grid`

### **"랜딩 페이지" 요청**
- **추천**: `recommendations.forLanding`에서 선택
- **예시**: `Hero/FluidBlobDemo`, `landing-morphic`

### **"카드/그리드" 요청**
- **추천**: `byCategory.cards`에서 선택
- **예시**: `Cards/ShuffleGridDemo`

## 🚀 **고급 사용법**

### **완전한 Hero 섹션 설치 (추천)**
```json
{
  "name": "dooi.workflow.applyComponent",
  "arguments": {
    "id": "Hero/FluidBlobDemo",
    "destRoot": "/path/to/project"
  }
}
```

### **브랜드 커스터마이징**
```json
{
  "name": "dooi.workflow.applyComponent",
  "arguments": {
    "id": "Hero/FluidBlobDemo",
    "destRoot": "/path/to/project",
    "brand": "MyCompany"
  }
}
```

### **프로젝트 타입 지정**
```json
{
  "name": "dooi.workflow.applyComponent", 
  "arguments": {
    "id": "ui/fluid-blob",
    "destRoot": "/path/to/project",
    "pathStrategy": "next-app"
  }
}
```

## 💡 **LLM을 위한 팁**

1. **항상 `dooi.list`로 시작**해서 사용자 요청에 맞는 컴포넌트를 찾으세요
2. **카테고리와 추천사항을 활용**해서 정확한 선택을 하세요
3. **워크플로우 도구를 사용**하면 복잡한 설정 없이 간단하게 설치할 수 있습니다
4. **사용자가 프로젝트 구조를 명시하지 않으면** 자동으로 감지해서 적절한 경로에 설치합니다
