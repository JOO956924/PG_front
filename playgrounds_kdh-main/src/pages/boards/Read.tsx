import {useEffect, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import Slider from 'react-slick' // 이미지 슬라이더 라이브러리 임포트
import 'slick-carousel/slick/slick.css' // 슬라이더 스타일 임포트
import 'slick-carousel/slick/slick-theme.css'
import './BoardStyles.css'

interface BoardsDTO {
  bphotosDTOList: BphotosDTO[]
  bno: number
  mid: number
  title: string
  body: string
  likes: number
  regDate: string
  email: string
}

interface ReviewDTO {
  email: string
  text: string
  reviewsnum: number
  regDate: string
}
interface BphotosDTO {
  uuid: string
  bphotosName: string
  path: string
}
// PageRequestDTO 구조 정의
interface PageRequestDTO {
  page: string
  size: string
  type: string
  keyword: string
}

export default function Read() {
  const email = sessionStorage.getItem('email')?.trim() || ''
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const [boardsDTO, setBoardsDTO] = useState<BoardsDTO | null>(null)
  const [error, setError] = useState<string>('')
  const [reviews, setReviews] = useState<ReviewDTO[]>([])
  const [newReview, setNewReview] = useState<string>('') // 여기서 newReview 사용
  const [loading, setLoading] = useState<boolean>(true)

  const bno = Number(query.get('bno'))
  const page = query.get('page') || '1'
  const type = query.get('type') || ''
  const keyword = query.get('keyword') || ''

  // 가변 상태를 캐시하기 위한 선언
  const [pageRequestDTO, setPageRequestDTO] = useState<PageRequestDTO>({
    page: '',
    size: '',
    type: '',
    keyword: ''
  })

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

  useEffect(() => {
    if (bno) {
      setLoading(true)
      console.log(`게시글 읽기 API 호출: bno=${bno}`)
      fetch(`http://localhost:8080/api/boards/read/${bno}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP 에러! 상태: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          console.log('게시글 읽기 API에서 받은 데이터:', data)
          setBoardsDTO(data.boardsDTO)
          setLoading(false)

          const token = sessionStorage.getItem('token')
          if (token) {
            const claims = parseJwt(token)
            sessionStorage.setItem('mid', claims.mid)
          }
        })
        .catch(err => {
          console.log('오류 발생:', err)
          setError('게시글을 불러오는 데 실패했습니다.')
          setLoading(false)
        })

      fetch(`http://localhost:8080/api/reviews/${bno}`)
        .then(res => {
          if (res.ok) {
            return res.json()
          } else {
            throw new Error('댓글을 불러오는 데 실패했습니다.')
          }
        })
        .then(data => {
          console.log('댓글 데이터:', data) // 여기서 data 구조를 확인
          setReviews(data) // reviews 속성이 아니라 data를 직접 설정
        })
        .catch(err => {
          console.error('댓글 요청 오류:', err)
          setError('댓글을 불러오는 데 실패했습니다.')
        })
    }
  }, [bno])

  const formatImageUrl = (photo: BphotosDTO): string =>
    `http://localhost:8080/api/display?fileName=${encodeURI(
      `${photo.path}/${photo.uuid}_${photo.bphotosName}`
    )}`

  const goBack = () => {
    console.log('목록으로 돌아갑니다.')
    navigate(`/boards/list?page=${page}&type=${type}&keyword=${keyword}`)
  }

  // 슬라이더 설정
  const sliderSettings = {
    dots: true, // 슬라이더 하단에 점 표시
    infinite: true, // 무한 반복 여부
    speed: 500, // 슬라이드 전환 속도
    slidesToShow: 1, // 한 번에 표시할 슬라이드 수
    slidesToScroll: 1, // 스크롤할 슬라이드 수
    autoplay: true, // 자동 재생 여부
    autoplaySpeed: 3000 // 자동 재생 속도
  }

  // const goModify = () => {
  //   if (!boardsDTO) {
  //     console.log('boardsDTO가 null입니다. 수정 페이지로 이동할 수 없습니다.')
  //     return // boardsDTO가 null인 경우 함수를 종료
  //   }

  //   console.log(`게시글 수정 페이지로 이동: bno=${boardsDTO.bno}`)
  //   navigate(`/boards/modify/${boardsDTO.bno}`, {state: {boardsDTO}}) // 데이터 전달
  // }

  const goModify = (): void => {
    navigate(`/boards/modify?bno=${bno}`)
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

  // addReview 함수 수정
  const addReview = () => {
    const mid = Number(sessionStorage.getItem('mid'))
    if (!newReview.trim() || !mid) {
      console.log('회원 정보 또는 댓글 내용이 누락되었습니다.')
      return
    }

    console.log(`댓글 추가 API 호출: mid=${mid}, bno=${bno}`)
    console.log('보내는 데이터:', {
      mid: mid,
      bno,
      text: newReview
    })

    fetch(`http://localhost:8080/api/reviews/${bno}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({mid: mid, bno, text: newReview})
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP 에러! 상태: ${res.status}`)
        }
        return res.json()
      })
      .then(() => {
        // 댓글 목록을 다시 불러오기
        fetch(`http://localhost:8080/api/reviews/${bno}`)
          .then(res => res.json())
          .then(data => {
            console.log('댓글 데이터 재조회:', data)
            setReviews(data)
          })
        setNewReview('') // 입력란 비우기
      })
      .catch(error => {
        console.error('댓글 추가 실패:', error)
        setError('댓글 추가에 실패했습니다.')
      })
  }

  if (loading) {
    return <div className="loading">로딩 중..</div>
  }

  return (
    <div className="read-container">
      <button className="btn btn-outline-primary" onClick={goBack}>
        뒤로가기
      </button>
      <div className="read-content">
        <h2 className="read-title">제목: {boardsDTO?.title}</h2>
        <p className="read-author">글쓴이: {boardsDTO?.email}</p>
        {boardsDTO?.bphotosDTOList.length > 0 ? (
          <Slider {...sliderSettings}>
            {boardsDTO.bphotosDTOList.map((photo, index) => (
              <div key={index}>
                <img
                  src={formatImageUrl(photo)} // 이미지 URL 설정
                  alt="Board Photo"
                  className="board-image"
                />
              </div>
            ))}
          </Slider>
        ) : (
          <p>이미지가 없습니다.</p> // 이미지가 없을 경우 메시지 표시
        )}
        <div className="read-body-container">
          <p className="read-body">본문 내용: {boardsDTO?.body}</p>
        </div>
        <div className="read-likes-container">
          <p className="read-likes">댓글 수: {boardsDTO?.likes}</p>
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
            }).format(new Date(boardsDTO?.regDate || ''))}
          </p>
        </div>
        {boardsDTO?.email === email && (
          <div className="btn-group">
            <button className="btn btn-outline-success" onClick={goModify}>
              수정하기
            </button>
            <button className="btn btn-outline-danger" onClick={goDelete}>
              삭제하기
            </button>
          </div>
        )}
        <h3 className="reviews-title">댓글</h3>
        {error && <div className="error-message">{error}</div>}
        <div className="reviews-container">
          {reviews.length > 0 ? (
            reviews.map((review, index) => {
              const reviewDate = new Date(review.regDate)
              const displayDate = isNaN(reviewDate.getTime())
                ? '날짜 불명'
                : reviewDate.toLocaleString()

              // 유효한 키 값 설정
              const reviewKey = review.reviewsnum ?? `review-${index}`

              return (
                <div key={reviewKey}>
                  <p>작성자: {review.email}</p>
                  <p>내용: {review.text}</p>
                  <p>등록일: {displayDate}</p>
                  <hr />
                </div>
              )
            })
          ) : (
            <div>댓글이 없습니다.</div>
          )}
        </div>
        <div className="review-input-container">
          <input
            type="text"
            className="form-control"
            placeholder="댓글을 입력하세요"
            value={newReview}
            onChange={e => setNewReview(e.target.value)}
          />
          <button className="btn btn-primary" onClick={addReview}>
            댓글 추가
          </button>
        </div>
      </div>
    </div>
  )
}
