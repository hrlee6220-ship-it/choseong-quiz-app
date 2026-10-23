# AGENTS.md - 교실 단체수업용 초성퀴즈 스튜디오 (Choseong Quiz App)

## 프로젝트 목표
선생님이 관리자 모드에서 엔터(Enter)만으로 단어나 문장을 빠르게 연속 입력하여 여러 버전의 초성퀴즈 세트를 저장·관리하고, 교실 단체수업 화면에서 문제를 랜덤으로 제시하며 단계별 힌트(1차: 받침 상하 공개, 2차: 선택한 글자 하나씩 모음까지 완전 공개)와 정답을 보여줄 수 있는 대화면 친화적 웹 애플리케이션.

## 검증 기준
1. **관리자 모드 (빠른 엔터 입력 & 다중 버전 관리)**:
   - 엔터만 치면서 단어·문장을 연속 입력하면 실시간으로 줄별 음절/초성/받침 분석 미리보기가 제공됨.
   - 여러 버전의 퀴즈 세트를 생성·수정·복제·삭제할 수 있으며, 브라우저 LocalStorage 저장과 클라우드(Supabase DB) 동기화 및 JSON 파일 내보내기/불러오기를 모두 지원함.
2. **수업 플레이 모드 (랜덤 출제 & 대화면 UI)**:
   - 선택한 버전의 단어/문장들이 랜덤으로 섞여 하나씩 제시되며, 다시 섞기·이전/다음 이동·전체화면·키보드 단축키·모둠 점수판을 지원함.
3. **단계별 힌트 시스템**:
   - 기본: 각 한글 글자의 초성만 표시.
   - 1차 힌트: 한 글자 카드 안에 위쪽은 초성, 아래쪽은 받침(종성)을 상하 배치하여 공개 (받침이 없는 글자는 '받침 없음' 표시).
   - 2차 힌트: 선생님이 선택한 글자 카드를 클릭할 때마다 해당 글자 하나씩 모음까지 완성된 글자로 공개.
   - 정답 공개: 전체 단어/문장 정답 공개 및 축하 효과.
4. **Supabase RLS 보안 검증**:
   - `public.quiz_sets` 테이블에 RLS 적용 완료 (비로그인·본인·타인 접근 권한 분리 및 실제 검증).

## 플랫폼 및 프로젝트 식별자
- **GitHub Repository**: `https://github.com/hrlee6220-ship-it/choseong-quiz-app`
- **Supabase Project Ref**: `zkdieqroarofjohoyibi`
- **Supabase Organization**: `wrkondnhupyzmbqwzytp` (hrlee6220-ship-it's Org)
- **Vercel Project Name**: `choseong-quiz-app`
- **Vercel Scope/Team**: `hrlee6220-ship-it` (`team_yWd0c945tvnoEkYlR89BI78u`)
