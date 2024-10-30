import {useEffect, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import './BoardStyles.css'

interface BoardsDTO {
  bno: number // 게시글 번호
  title: string // 게시글 제목
  body: string // 본문 내용
  likes: number // 좋아요 수
  regDate: string // 등록 날짜
  bphotosDTOList: {path: string; thumbnailURL: string}[] // 이미지 목록
  email: string // 작성자 이메일
  reviews: Review[] // 댓글 목록 추가
}

interface Review {
  reviewsNum: number // 댓글 번호
  body: string | null // 댓글 내용
  email: string // 댓글 작성자 이메일
  regDate: string // 댓글 등록 날짜
}

export default function StyledRead() {
  const email = sessionStorage.getItem('email')?.trim() || '' // 세션 스토리지에서 이메일 가져오기
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const [boardsDTO, setBoardsDTO] = useState<BoardsDTO | null>(null)
  const [reviews, setReviews] = useState<Review[]>([]) // 댓글 상태
  const [newReview, setNewReview] = useState<string>('') // 새로운 댓글 상태

  // URL에서 bno, page, type, keyword 추출
  const bno = Number(query.get('bno'))
  const page = query.get('page') || '1'
  const type = query.get('type') || ''
  const keyword = query.get('keyword') || ''

  useEffect(() => {
    if (bno) {
      console.log(`게시글 읽기 API 호출: bno=${bno}`)
      // 게시글 읽기 API 호출
      fetch(`http://localhost:8080/api/boards/read/${bno}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}` // 토큰 인증
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
          setBoardsDTO(data.boardsDTO) // 데이터 설정
          setReviews(data.boardsDTO.reviews || []) // 댓글 설정
        })
        .catch(err => console.log('오류 발생:', err))
    } else {
      console.warn('게시글 번호가 유효하지 않습니다.')
    }
  }, [bno])

  // 데이터가 로드 중일 때 로딩 표시
  if (!boardsDTO) {
    return <div className="loading">로딩 중..</div>
  }

  // 목록으로 돌아가는 함수
  const goBack = () => {
    console.log('목록으로 돌아갑니다.')
    navigate(`/boards/list?page=${page}&type=${type}&keyword=${keyword}`)
  }

  // 게시글 수정 함수
  const goModify = () => {
    console.log(`게시글 수정 페이지로 이동: bno=${boardsDTO.bno}`)
    navigate(`/boards/modify/${boardsDTO.bno}`)
  }

  // 게시글 삭제 함수
  const goDelete = () => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      console.log(`게시글 삭제 API 호출: bno=${boardsDTO.bno}`)
      fetch(`http://localhost:8080/api/boards/remove/${boardsDTO.bno}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}` // 토큰 인증
        },
        body: JSON.stringify({page, type, keyword}) // 추가 파라미터 전송
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
          navigate(`/boards/list?page=${page}&type=${type}&keyword=${keyword}`) // 삭제 후 목록으로 이동
        })
        .catch(err => console.log('오류 발생:', err))
    } else {
      console.log('게시글 삭제가 취소되었습니다.')
    }
  }

  // 리뷰 제출 함수
  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newReview.trim()) {
      const reviewData = {
        body: newReview, // 댓글 내용
        bno: boardsDTO.bno, // 게시글 번호
        email: email // 세션 스토리지에서 사용자 ID 가져오기
      }
      console.log(`댓글 제출: ${JSON.stringify(reviewData)}`)
      fetch(`http://localhost:8080/api/reviews/${boardsDTO.bno}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}` // 토큰 인증
        },
        body: JSON.stringify(reviewData)
      })
        .then(res => {
          console.log(`댓글 제출 API 응답 상태: ${res.status}`)
          if (!res.ok) {
            throw new Error(`HTTP 에러! 상태: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          console.log('댓글이 추가되었습니다:', data)
          setReviews(prevReviews => [data, ...prevReviews]) // 댓글 추가 (최신 댓글을 앞에)
          setNewReview('') // 입력 필드 비우기
        })
        .catch(err => console.log('오류 발생:', err))
    } else {
      alert('댓글 내용을 입력해 주세요.')
      console.warn('댓글 내용이 비어 있습니다.')
    }
  }

  // 댓글 삭제 함수
  const deleteReview = (reviewNum: number) => {
    fetch(`http://localhost:8080/api/reviews/remove/${reviewNum}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('댓글 삭제 실패')
        }
        return res.json()
      })
      .then(() => {
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review.reviewsNum === reviewNum
              ? {...review, body: '삭제된 댓글입니다.'}
              : review
          )
        )
      })
      .catch(err => console.error('댓글 삭제 오류:', err))
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
      </div>

      <div className="button-container">
        {boardsDTO.email === email ? ( // 작성자 이메일과 현재 이메일이 일치할 경우
          <>
            <button className="btn btn-outline-secondary" onClick={goModify}>
              수정하기
            </button>
            <button className="btn btn-outline-danger" onClick={goDelete}>
              삭제하기
            </button>
          </>
        ) : (
          <p>수정하거나 삭제할 수 없습니다.</p>
        )}
      </div>

      {/* 리뷰 입력 및 목록 */}
      <div className="review-section">
        <h3>댓글 달기</h3>
        <form onSubmit={handleReviewSubmit}>
          <textarea
            value={newReview}
            onChange={e => setNewReview(e.target.value)}
            placeholder="댓글을 입력하세요."
            className="form-control"
            required
          />
          <button type="submit" className="btn btn-primary">
            댓글 달기
          </button>
        </form>
        <h4>댓글 목록</h4>
        <ul className="review-list">
          {reviews
            .sort((a, b) => b.reviewsNum - a.reviewsNum) // 댓글 번호 기준 내림차순 정렬
            .map(review => (
              <li key={review.reviewsNum}>
                <strong>{review.email}</strong>: {review.body ?? '삭제된 댓글입니다.'}{' '}
                {review.email === email && review.body !== '삭제된 댓글입니다.' && (
                  <button
                    onClick={() => deleteReview(review.reviewsNum)}
                    className="btn btn-danger btn-sm">
                    삭제
                  </button>
                )}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}
