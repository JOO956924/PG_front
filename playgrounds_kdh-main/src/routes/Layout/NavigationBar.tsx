import {useNavigate} from 'react-router-dom'
import {useEffect, useState} from 'react'
import '../../App.css'
import type {FC, CSSProperties} from 'react'
import {FaBars} from 'react-icons/fa' // 메뉴 아이콘을 위해 react-icons 사용

export type NavProps = {
  style?: CSSProperties
}

export const NavigationBar: FC<NavProps> = ({style}) => {
  const navigate = useNavigate()

  const [email, setEmail] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false) // 모바일인지 여부를 추적

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('email')
    if (storedEmail) {
      setEmail(storedEmail)
    }

    // 화면 크기 변화 감지
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    // 처음 로드될 때 및 리사이즈 이벤트 설정
    handleResize()
    window.addEventListener('resize', handleResize)

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const logout = (e: React.MouseEvent) => {
    e.preventDefault()
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('email')
    sessionStorage.removeItem('name')
    navigate('/login')
  }

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-primary"
      id="topNav"
      style={{position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 10}}>
      <div className="container-fluid">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            alignItems: 'center'
          }}>
          {/* 경기 참여, 자유 게시판, 내 정보 버튼 */}
          <div style={{flex: 1, display: 'flex', justifyContent: 'flex-start'}}>
            <a
              className="btn btn-light"
              href="/grounds/list"
              style={{marginRight: '10px'}}>
              경기 참여
            </a>
            <a
              className="btn btn-light"
              href="/boards/list"
              style={{marginRight: '10px'}}>
              자유 게시판
            </a>
            <a className="btn btn-light" href="/members/profile">
              내 정보
            </a>
          </div>

          {/* 이메일, 환영 문구, 로그아웃 버튼: 모바일에서는 환영 문구 숨김 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              whiteSpace: 'nowrap'
            }}>
            <a className="navbar-brand" href="#page-top" style={{marginRight: '10px'}}>
              {email ? email : '사용자이메일'}
            </a>
            {!isMobile && ( // 모바일이 아닐 때만 환영 문구 표시
              <span style={{color: 'white', marginRight: '10px'}}>
                님 Play Grounds 에 오신것을 환영합니다.
              </span>
            )}
            <button
              className="btn btn-danger"
              onClick={logout}
              style={{marginLeft: '10px'}}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
