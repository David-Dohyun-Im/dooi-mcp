# LLM-Empowered DooiUI MCP 서버 사용 가이드

## 🎯 **LLM이 직접 선택하는 시스템**

이제 LLM이 하드코딩된 추천 없이 태그와 설명을 기반으로 직접 컴포넌트를 선택할 수 있습니다.

## 🧠 **LLM 선택 프로세스**

### **1단계: 컴포넌트 목록 확인**
```json
{
  "name": "dooi.list",
  "arguments": {}
}
```

### **2단계: 태그와 설명을 기반으로 선택**
LLM이 다음 정보를 활용해서 선택:
- **태그**: `3d`, `animation`, `hero`, `background` 등
- **설명**: 컴포넌트의 구체적인 기능 설명
- **카테고리**: `Hero`, `Cards`, `ui` 등

### **3단계: 적절한 컴포넌트 설치**
```json
{
  "name": "dooi.workflow.applyComponent",
  "arguments": {
    "id": "선택한_컴포넌트_ID",
    "destRoot": "/path/to/project"
  }
}
```

## 🎨 **사용자 요청별 LLM 선택 예시**

### **"3D 배경을 만들어줘"**
**LLM의 판단 과정:**
1. `dooi.list`로 컴포넌트 목록 확인
2. `3d` 태그가 있는 컴포넌트들 찾기:
   - `Hero/FluidBlobDemo`: "Complete 3D lava lamp hero section..."
   - `ui/fluid-blob`: "Basic 3D fluid blob component..."
3. 더 완전한 섹션인 `Hero/FluidBlobDemo` 선택

### **"애니메이션 카드를 만들어줘"**
**LLM의 판단 과정:**
1. `animation` 태그가 있는 컴포넌트들 찾기:
   - `Cards/ShuffleGridDemo`: "Animated image shuffle grid..."
   - `ui/shuffle-grid`: "Animated image shuffle grid..."
2. 완전한 카드 컴포넌트인 `Cards/ShuffleGridDemo` 선택

### **"Hero 섹션을 만들어줘"**
**LLM의 판단 과정:**
1. `hero` 태그가 있는 컴포넌트들 찾기:
   - `Hero/FluidBlobDemo`: "Complete 3D lava lamp hero section..."
2. 유일한 Hero 컴포넌트인 `Hero/FluidBlobDemo` 선택

## 🏷️ **태그 시스템 활용**

### **주요 태그들:**
- **`3d`**: 3D 효과가 있는 컴포넌트
- **`animation`**: 애니메이션이 있는 컴포넌트
- **`hero`**: Hero 섹션용 컴포넌트
- **`background`**: 배경용 컴포넌트
- **`interactive`**: 상호작용이 있는 컴포넌트
- **`transitions`**: 전환 효과가 있는 컴포넌트

### **카테고리별 특징:**
- **`Hero`**: 완전한 Hero 섹션 (우선 선택)
- **`Cards`**: 완전한 카드 컴포넌트 (우선 선택)
- **`ui`**: 기본 UI 컴포넌트 (fallback)

## 💡 **LLM을 위한 팁**

1. **태그 우선**: 사용자 요청과 관련된 태그를 가진 컴포넌트를 찾으세요
2. **설명 활용**: 태그가 비슷하다면 설명을 보고 더 적합한 것을 선택하세요
3. **카테고리 고려**: `Hero`, `Cards` 카테고리가 `ui` 카테고리보다 완전한 컴포넌트입니다
4. **컨텍스트 이해**: 사용자의 요청을 정확히 파악하고 가장 적합한 컴포넌트를 선택하세요

## 🚀 **고급 사용법**

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
    "id": "Cards/ShuffleGridDemo",
    "destRoot": "/path/to/project",
    "pathStrategy": "next-app"
  }
}
```

## 🎯 **시스템의 장점**

✅ **유연성**: 새로운 컴포넌트 추가 시 하드코딩 수정 불필요  
✅ **확장성**: 태그 시스템으로 다양한 검색 조건 지원  
✅ **지능성**: LLM이 컨텍스트를 이해하고 적절한 선택  
✅ **유지보수성**: 메타데이터만 업데이트하면 됨  

이제 LLM이 더 지능적이고 유연하게 컴포넌트를 선택할 수 있습니다! 🧠✨
