import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import './BoardStyles.css'

interface BoardsDTO {
  bno: number
  title: string
  body: string
  likes: number
  regDate: string
  bphotosDTOList: {path: string; thumbnailURL: string}[]
  email: string
}

// MainContents 컴포넌트 정의
const MainContents = ({
  style,
  children
}: {
  style?: React.CSSProperties
  children: React.ReactNode
}) => {
  return (
    <div className="p-0 container-fluid" style={style}>
      <section id="about" style={{margin: '0 40px', minHeight: '100vh'}}>
        <div className="resume-section-content">
          <h1 className="mt-4">게시판</h1>
          <div className="resume-section">{children}</div>
        </div>
      </section>
    </div>
  )
}

// NavigationBar 컴포넌트 정의
const NavigationBar = ({style}: {style?: React.CSSProperties}) => {
  return (
    <nav style={style}>
      <h2>Navigation Bar</h2>
      {/* 여기서 다른 내비게이션 항목들을 추가할 수 있습니다 */}
    </nav>
  )
}

export default function Modify() {
  const {bno} = useParams<{bno: string}>()
  const navigate = useNavigate()
  const [boardsDTO, setBoardsDTO] = useState<BoardsDTO | null>(null)
  const [modifiedDate, setModifiedDate] = useState<string | null>(null)
  const email = sessionStorage.getItem('email') || ''
  const csrfToken = sessionStorage.getItem('csrfToken') || ''

  useEffect(() => {
    if (bno) {
      fetch(`http://localhost:8080/api/boards/modify/${bno}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          setBoardsDTO(data.boardsDTO)
        })
        .catch(err => {
          console.log('Error:', err)
          alert('게시글 정보를 불러오는 데 실패했습니다.')
        })
    }
  }, [bno])

  const handleModify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (boardsDTO) {
      const modifiedData = {
        ...boardsDTO,
        title: e.currentTarget.title.value,
        body: e.currentTarget.body.value,
        modifiedDate: new Date().toISOString()
      }
      console.log('Modified data:', modifiedData)

      fetch(`http://localhost:8080/api/boards/modify/${bno}`, {
        // bno 추가
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(modifiedData)
      })
        .then(res => {
          console.log('Response:', res) // 추가된 로깅
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.text()
        })
        .then(() => {
          alert('수정 완료')
          setModifiedDate(modifiedData.modifiedDate)
          navigate(`/boards/read?bno=${bno}`)
        })
        .catch(err => {
          console.log('Error:', err)
          alert('게시글 수정에 실패했습니다.')
        })
    }
  }

  if (!boardsDTO) {
    return <div className="loading">Loading..</div>
  }

  return (
    <div>
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

      <div style={{paddingTop: '60px'}}>
        <MainContents
          style={{
            backgroundColor: 'white',
            padding: '20px',
            textAlign: 'left',
            overflowY: 'auto',
            minHeight: '100vh'
          }}>
          <div className="modify-container">
            <h2 className="centered-title">게시글 수정</h2>
            <form onSubmit={handleModify} className="register-form">
              <div className="form-group">
                <label htmlFor="email">작성자 이메일</label>
                <input
                  type="text"
                  value={boardsDTO.email}
                  className="form-control"
                  id="email"
                  readOnly
                />
              </div>
              <div className="form-group">
                <label htmlFor="title">제목</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={boardsDTO.title}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="body">본문</label>
                <textarea
                  name="body"
                  defaultValue={boardsDTO.body}
                  className="form-control content-textarea"
                  required
                />
              </div>
              <input type="hidden" name="_csrf" value={csrfToken} />
              <div className="button-container">
                <button type="submit" className="btn btn-success">
                  수정하기
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}>
                  취소
                </button>
              </div>
              {modifiedDate && (
                <div className="modified-date">
                  <p>
                    수정 날짜:{' '}
                    {new Intl.DateTimeFormat('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).format(new Date(modifiedDate))}
                  </p>
                </div>
              )}
            </form>
          </div>
        </MainContents>
      </div>
    </div>
  )
}
