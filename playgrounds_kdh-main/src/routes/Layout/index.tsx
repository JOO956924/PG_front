import {MainContents} from './MainContents'
import {NavigationBar} from './NavigationBar'

// 광고 배너 이미지 가져오기
import leftBannerImg from '../../assets/no-img.gif'
import rightBannerImg from '../../assets/no-img.gif'

export default function Layout() {
  return (
    <>
      {/* 상단에 고정된 네비게이션 바 */}
      <NavigationBar
        style={{
          backgroundColor: '#bd5d38',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1000
        }}
      />

      {/* 전체 레이아웃 컨테이너 */}
      <div
        style={{
          display: 'flex',
          paddingTop: '60px', // 네비게이션 바 아래 공간 확보
          backgroundColor: '#f4f4f4',
          minHeight: '100vh'
        }}>
        {/* 왼쪽 광고 배너 */}
        <div
          style={{
            width: '130px',
            position: 'fixed',
            top: '60px', // 네비게이션 바 아래부터 시작
            left: 0,
            height: 'calc(100vh - 60px)',
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <img
            src={leftBannerImg}
            alt="Left Banner"
            style={{width: 'auto', height: '100%', objectFit: 'contain'}}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'white',
            paddingTop: '20px',
            paddingBottom: '20px',
            textAlign: 'left',
            overflowY: 'auto'
          }}>
          <MainContents />
        </div>

        {/* 오른쪽 광고 배너 */}
        <div
          style={{
            width: '130px',
            position: 'fixed',
            top: '60px', // 네비게이션 바 아래부터 시작
            right: 0,
            height: 'calc(100vh - 60px)',
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <img
            src={rightBannerImg}
            alt="Right Banner"
            style={{width: 'auto', height: '100%', objectFit: 'contain'}}
          />
        </div>
      </div>
    </>
  )
}
