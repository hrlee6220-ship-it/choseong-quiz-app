# Project Guidelines (GEMINI.md)

## 프로젝트 식별자 (Choseong Quiz App)
- **GitHub Repository**: `https://github.com/hrlee6220-ship-it/choseong-quiz-app`
- **Supabase Project Ref**: `zkdieqroarofjohoyibi`
- **Supabase Organization**: `wrkondnhupyzmbqwzytp`
- **Vercel Project Name**: `choseong-quiz-app`
- **Vercel Project ID**: `prj_GvYltPpByshEAdZunMaf1iWGFbWL`
- **Vercel Org ID**: `team_yWd0c945tvnoEkYlR89BI78u`

## DoRms 연수 규칙
- 사용자가 요청한 프로젝트의 계획·구현·검사·GitHub 저장과 push·Supabase 생성과 DB 편집·Vercel 배포와 재배포를 사용자 계정 전체 권한으로 이어서 처리한다. 이미 허용한 개발 작업을 다시 승인받지 않는다.
- 프로젝트마다 저장소 URL·Supabase project ref·Vercel projectId/orgId를 프로젝트 지침에 기록해 다른 프로젝트를 헷갈려 바꾸지 않는다. 비밀값은 인증 저장소에 둔다.
- 데이터 저장이 필요하면 DB를 만들고 비로그인·본인·타인 접근을 실제 검사한다. 데이터 저장이 필요 없으면 DB를 만들지 않는다. RLS와 서버 권한 검사는 https://supabase.com/docs/guides/database/postgres/row-level-security 를 따른다.
- .env.local·인증 파일·.vercel·비밀값·학생 개인정보를 Git에 넣지 않는다. 비밀값은 서버 환경변수에 보관하고 공개용 키와 구분한다.
- 비밀번호·토큰·API 키는 채팅·Git·로그에 출력하지 않는다.
