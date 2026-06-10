# AI 학습 균형 지도

생성형 AI 사용 패턴과 학생의 학업 지표를 히트맵으로 탐색하는 정적 웹사이트입니다.

## 포함된 화면

- 핵심 질문과 데이터 요약 카드
- AI 사용 목적별 GPA 변화량 막대그래프
- AI 사용 시간별 번아웃 위험 막대그래프
- 학교 정책별 GPA 변화량 막대그래프
- 전공 × AI 사용 목적: 평균 GPA 변화량
- AI 사용 시간 × 기존 공부 시간: 평균 번아웃 위험
- 학년 × AI 의존도: 평균 시험 불안
- 프롬프트 실력 × 도구 수: 평균 학습 유지 점수
- 학교 정책 × 사용 목적: 평균 GPA 변화량

## 데이터

- 원본: `data/student_ai_impact.csv`
- 브라우저에서 바로 열 수 있도록 같은 데이터를 `data/student_ai_impact_data.js`에도 포함했습니다.
- `AI 의존도`의 1~5는 낮음부터 매우 높음까지의 자기 인식 단계입니다.
- `GPA 변화량`은 `학기 후 GPA - 학기 전 GPA`입니다. 예를 들어 `+0.201점`은 평균 GPA가 0.201점 상승했다는 뜻입니다.
- 히트맵 아래에는 현재 지표가 어떻게 계산되는지 설명하는 해석 문구를 넣었습니다.

## GitHub Pages 업로드

1. 이 폴더의 파일을 GitHub 저장소에 업로드합니다.
2. 저장소 Settings > Pages로 이동합니다.
3. Source를 `Deploy from a branch`로 선택합니다.
4. Branch를 `main`, folder를 `/root`로 선택하고 저장합니다.
5. 배포 주소가 생성되면 `index.html`이 첫 화면으로 열립니다.

## 파일 구조

```text
index.html
styles.css
app.js
data/
  student_ai_impact.csv
  student_ai_impact_data.js
```
