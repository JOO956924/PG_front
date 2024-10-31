import {useEffect, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import './BoardStyles.css'

interface BoardsDTO {
  bno: number
  mid: number
  title: string
  body: string
  likes: number
  regDate: string
  bphotosDTOList: {path: string; thumbnailURL: string}[]
  email: string
}

interface ReviewDTO {
  reviewId: number
  memberId: number
  body: string
  regDate: string
}

export default function Read() {
  const email = sessionStorage.getItem('email')?.trim() || ''
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const [boardsDTO, setBoardsDTO] = useState<BoardsDTO | null>(null)
  const [error, setError] = useState<string>('')
  const [reviews, setReviews] = useState<ReviewDTO[]>([])
  const [newReview, setNewReview] = useState<string>('')

  const bno = Number(query.get('bno'))
  const page = query.get('page') || '1'
  const type = query.get('type') || ''
  const keyword = query.get('keyword') || ''

  useEffect(() => {
    if (bno) {
      console.log(`게시글 읽기 API 호출: bno=${bno}`)
      fetch(`http://localhost:8080/api/boards/read/${bno}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
        }
      })
        .then(res => {
          console.log(`API 응답 상태: ${res.status}`)
          if (!res.ok) {
            throw new Error(`HTTP 에러! 상태: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          console.log('게시글 읽기 API에서 받은 데이터:', data)
          setBoardsDTO(data.boardsDTO)

          // JWT에서 mid 추출하여 세션 스토리지에 저장
          const token = sessionStorage.getItem('token')
          if (token) {
            const claims = parseJwt(token) // parseJwt 함수 사용
            sessionStorage.setItem('memberId', claims.mid) // mid 저장
          }
        })
        .catch(err => {
          console.log('오류 발생:', err)
          setError('게시글을 불러오는 데 실패했습니다.')
        })

      fetch(`http://localhost:8080/api/reviews/list?bno=${bno}`)
        .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
        .then(data => setReviews(data.reviews))
        .catch(() => setError('댓글을 불러오는 데 실패했습니다.'))
    } else {
      console.warn('게시글 번호가 유효하지 않습니다.')
    }
  }, [bno])

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('JWT 파싱 실패:', error)
      return {}
    }
  }

  const goBack = () => {
    console.log('목록으로 돌아갑니다.')
    navigate(`/boards/list?page=${page}&type=${type}&keyword=${keyword}`)
  }

  const goModify = () => {
    console.log(`게시글 수정 페이지로 이동: bno=${boardsDTO?.bno}`)
    navigate(`/boards/modify/${boardsDTO?.bno}`)
  }

  const goDelete = () => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      console.log(`게시글 삭제 API 호출: bno=${boardsDTO?.bno}`)
      fetch(`http://localhost:8080/api/boards/remove/${boardsDTO?.bno}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({page, type, keyword})
      })
        .then(res => {
          console.log(`삭제 API 응답 상태: ${res.status}`)
          if (!res.ok) {
            throw new Error(`HTTP 에러! 상태: ${res.status}`)
          }
          return res.json()
        })
        .then(() => {
          alert('게시글이 삭제되었습니다.')
          navigate(`/boards/list?page=${page}&type=${type}&keyword=${keyword}`)
        })
        .catch(err => console.log('오류 발생:', err))
    } else {
      console.log('게시글 삭제가 취소되었습니다.')
    }
  }

  const addReview = () => {
    const memberId = Number(sessionStorage.getItem('memberId'))
    if (!newReview.trim() || !memberId) {
      console.log('회원 정보 또는 댓글 내용이 누락되었습니다.')
      return
    }

    console.log(`댓글 추가 API 호출: memberId=${memberId}, boardId=${bno}`)
    fetch(`http://localhost:8080/api/reviews/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({memberId, boardId: bno, body: newReview})
    })
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(newReviewData => {
        console.log('댓글 추가 성공:', newReviewData)
        setReviews([newReviewData, ...reviews])
        setNewReview('')
      })
      .catch(error => {
        console.error('댓글 추가 실패:', error)
        setError('댓글 추가에 실패했습니다.')
      })
  }

  if (!boardsDTO) {
    return <div className="loading">로딩 중..</div>
  }

  return (
    <div className="read-container">
      <button className="btn btn-outline-primary" onClick={goBack}>
        뒤로가기
      </button>
      <div className="read-content">
        <h2 className="read-title">제목: {boardsDTO.title}</h2>
        <p className="read-author">글쓴이: {boardsDTO.email}</p>

        <div className="read-image-container">
          {boardsDTO.bphotosDTOList.length > 0 && (
            <img
              src={`http://localhost:8080/api/display?fileName=${boardsDTO.bphotosDTOList[0].thumbnailURL}`}
              alt="게시글 썸네일"
              className="read-thumbnail"
            />
          )}
        </div>

        <div className="read-body-container">
          <p className="read-body">본문 내용: {boardsDTO.body}</p>
        </div>

        <div className="read-likes-container">
          <p className="read-likes">좋아요 수: {boardsDTO.likes}</p>
        </div>

        <div className="read-date-container">
          <p className="read-date">
            등록 날짜:{' '}
            {new Intl.DateTimeFormat('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).format(new Date(boardsDTO.regDate))}
          </p>
        </div>

        <div className="button-container">
          {boardsDTO.email === email && (
            <>
              <button className="btn btn-warning" onClick={goModify}>
                수정하기
              </button>
              <button className="btn btn-danger" onClick={goDelete}>
                삭제하기
              </button>
            </>
          )}
        </div>
      </div>

      {/* 댓글 입력 및 목록 표시 */}
      <div className="review-section">
        <h3>댓글</h3>
        <input
          type="text"
          className="review-input"
          placeholder="댓글을 입력하세요"
          value={newReview}
          onChange={e => setNewReview(e.target.value)}
        />
        <button className="btn btn-primary" onClick={addReview}>
          댓글 추가
        </button>

        <ul className="review-list">
          {reviews.map(review => (
            <li key={review.reviewId} className="review-item">
              <p>
                <strong>{review.memberId}</strong>: {review.body}
              </p>
              <p>{new Date(review.regDate).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
