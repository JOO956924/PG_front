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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev)
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
          {/* 메뉴 버튼: 모바일일 때는 아이콘, 데스크탑에서는 텍스트 */}
          <div style={{flex: 1}}>
            <button
              className="btn btn-light"
              type="button"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              style={{padding: '5px'}}>
              {isMobile ? <FaBars /> : isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            </button>
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

        {isMenuOpen && (
          <div
            className="navbar-collapse"
            id="navbarResponsive"
            style={{
              position: 'absolute',
              top: 'calc(100% + 5px)',
              left: '0',
              backgroundColor: '#dc7545',
              zIndex: 1,
              transition: 'all 0.3s ease',
              padding: '10px',
              display: 'block'
            }}>
            <ul
              className="navbar-nav"
              style={{
                padding: 0,
                margin: 0,
                listStyleType: 'none',
                display: 'flex',
                flexDirection: 'column'
              }}>
              <li className="nav-item" style={{marginBottom: '5px'}}>
                <a
                  className="nav-link"
                  href="/grounds/list"
                  style={{display: 'block', color: 'white'}}>
                  경기 참여
                </a>
              </li>
              <li className="nav-item" style={{marginBottom: '5px'}}>
                <a
                  className="nav-link"
                  href="/boards/list"
                  style={{display: 'block', color: 'white'}}>
                  자유게시판 및 건의사항
                </a>
              </li>
              <li className="nav-item" style={{marginBottom: '5px'}}>
                <a
                  className="nav-link"
                  href="/members/mypage"
                  style={{display: 'block', color: 'white'}}>
                  내 페이지
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  )
}
