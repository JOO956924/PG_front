import {SyntheticEvent, useEffect, useState} from 'react'
import {useNavigate, useSearchParams, useLocation} from 'react-router-dom'
import useToken from '../../hooks/useToken'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import defaultImg from '../../assets/no-img.gif'
import './Read.css'

interface GroundsDTO {
  gphotosDTOList: GphotosDTO[]
  gno: number
  day: number
  reviewsCnt: number
  gtitle: string
  location: string
  sports: string
  reservation: string
  groundstime: string
  email: string | null
  name: string | null
  info: string
  price: number
  maxpeople: number
  nowpeople: number
  regDate: string
  modDate: string
}

interface GphotosDTO {
  uuid: string | Blob
  gphotosName: string | Blob
  path: string | Blob
}

interface PageRequestDTO {
  page: string
  size: string
  type: string
  keyword: string
  day: string // day 필드 추가
}

interface PageResultDTO {
  dtoList: GroundsDTO[]
  page: number
  start: number
  end: number
  pageList: number[]
  prev: boolean
  next: boolean
}

interface GroundsReviewsDTO {
  gno: number
  grno: number
  mid: number
  email: string
  name: string
  regDate: string
  modDate: string
}

export default function Read() {
  const [searchParams] = useSearchParams()
  const gno = searchParams.get('gno')
  const token = useToken()
  const navigate = useNavigate()
  const [query, setQuery] = useSearchParams()
  const location = useLocation()
  const [groundsDTO, setGroundsDTO] = useState<GroundsDTO | null>(null)
  const [groundsReviewsDTO, setGroundsReviewsDTO] = useState<GroundsReviewsDTO[] | null>(
    null
  )
  const addDefaultImg = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultImg
  }

  const [pageRequestDTO, setPageRequestDTO] = useState<PageRequestDTO>({
    page: '',
    size: '',
    type: '',
    keyword: '',
    day: ''
  })

  const [pageResultDTO, setPageResultDTO] = useState<PageResultDTO | null>(null)
  const [keywords, setKeywords] = useState(query.get('keyword') || '')
  const [types, setTypes] = useState(query.get('type') || '')
  const [selectedDay, setSelectedDay] = useState(query.get('day') || '')

  // 날짜 변환 함수
  const formatDate = (dateInt: number): string => {
    const dateStr = dateInt.toString()
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}년 ${month}월 ${day}일`
  }

  useEffect(() => {
    if (token && gno) {
      fetch(`http://localhost:8080/api/grounds/read/${gno}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          setGroundsDTO(data.groundsDTO)
        })
        .catch(err => console.log('Error:', err))
    }
  }, [gno, token])

  useEffect(() => {
    if (token && gno) {
      fetch(`http://localhost:8080/api/greviews/all/${gno}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          setGroundsReviewsDTO(data)
        })
        .catch(err => console.log('Error:', err))
    }
  }, [gno, token])

  const goModify = (gno: number) => {
    navigate(
      `/grounds/modify?gno=${gno}&page=${pageRequestDTO.page}&type=${
        pageRequestDTO.type
      }&keyword=${pageRequestDTO.keyword}&day=${selectedDay || query.get('day')}`
    )
  }

  const handleReservation = () => {
    const email = sessionStorage.getItem('email')
    if (!email || !gno) {
      alert('로그인이 필요합니다.')
      return
    }

    // 예약 날짜와 시간이 현재 날짜와 시간보다 이전인지 확인
    const reservationDateTime = new Date(
      `${groundsDTO.day.toString().substring(0, 4)}-${groundsDTO.day
        .toString()
        .substring(4, 6)}-${groundsDTO.day.toString().substring(6, 8)}T${
        groundsDTO.groundstime
      }`
    )
    const now = new Date()
    if (reservationDateTime < now) {
      alert('예약 날짜와 시간이 현재 시각보다 이전입니다. 예약할 수 없습니다.')
      return
    }

    // 동일한 사람의 중복 예약 확인
    if (groundsReviewsDTO && groundsReviewsDTO.some(review => review.email === email)) {
      alert('이미 예약이 존재합니다.')
      return
    }

    // 회원 정보를 가져와 nowcash 확인
    fetch(`http://localhost:8080/api/members/email/${email}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(memberData => {
        const groundsPrice = groundsDTO.price // 경기장 가격
        const nowCash = memberData.nowcash // 회원의 현재 캐쉬

        // nowcash가 가격보다 부족한 경우
        if (nowCash < groundsPrice) {
          alert('캐쉬가 부족합니다. 충전해 주세요.')
          return // 예약 등록 중지
        }

        // 이제 예약 등록 진행
        const reviewData = {
          gno: Number(gno),
          mid: memberData.mid,
          email: memberData.email,
          name: memberData.name
        }

        fetch(`http://localhost:8080/api/greviews/${gno}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(reviewData)
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`)
            }
            return res.json()
          })
          .then(data => {
            alert('예약이 성공적으로 등록되었습니다.')
            setGroundsReviewsDTO(prev => [...(prev || []), data])
            // nowcash에서 가격 차감 로직 추가
            return fetch(`http://localhost:8080/api/members/charge`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({email, addcash: -groundsPrice})
            })
          })
          .catch(err => console.log('Error:', err))
      })
      .catch(err => console.log('Error:', err))
  }

  const handleDelete = async (grno: number) => {
    try {
      // 리뷰 삭제 요청
      await fetch(`http://localhost:8080/api/greviews/${groundsDTO.gno}/${grno}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      // 리뷰 삭제 성공 시, nowcash 업데이트 요청
      const email = sessionStorage.getItem('email')
      if (email) {
        const groundsPrice = groundsDTO.price // 경기장 가격
        await fetch(`http://localhost:8080/api/members/charge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({email, addcash: groundsPrice})
        })
      }

      // 상태 업데이트 및 알림
      setGroundsReviewsDTO(prev => prev?.filter(review => review.grno !== grno) || null)
      alert('예약이 성공적으로 취소되었습니다.')
    } catch (error) {
      console.error('예약 취소 실패:', error)
    }
  }

  if (!groundsDTO) {
    return <div>Loading...</div>
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000
  }

  return (
    <div className="container">
      <button className="modify-button" onClick={() => goModify(groundsDTO.gno)}>
        수정
      </button>

      <div className="carousel-container">
        <Slider {...sliderSettings}>
          {groundsDTO.gphotosDTOList.map((photo, idx) => (
            <div key={idx} className="carousel-slide">
              <img
                src={
                  photo.path
                    ? `http://localhost:8080/api/display?fileName=${photo.path}`
                    : defaultImg
                }
                alt={`슬라이드 이미지 ${idx + 1}`}
                className="carousel-image"
                onError={addDefaultImg}
              />
            </div>
          ))}
        </Slider>
      </div>

      <div className="card">
        <div className="card-header">
          {/* <div className="ground-title">{groundsDTO.gtitle}</div> */}
          <button className="favorite-button">즐겨찾기</button>
        </div>
        <div className="card-body">
          <div className="ground-details">
            <div>
              <h1>{groundsDTO.gtitle}</h1>
              {/* <p>게시물 등록: {new Date(groundsDTO.regDate).toLocaleString()}</p> */}
              {/* <p>게시물 수정: {new Date(groundsDTO.modDate).toLocaleString()}</p> */}
              <p>장소: {groundsDTO.location}</p>
              <p>종목: {groundsDTO.sports}</p>
              <p>경기 날짜: {formatDate(groundsDTO.day)}</p>
              <p>경기 시간: {groundsDTO.groundstime}</p>
              <p>모집 인원: {groundsDTO.maxpeople} 명</p>
              <p>요금: {groundsDTO.price.toLocaleString()} 원</p>
            </div>
          </div>
          <div className="card-description">설명 및 대여 규정</div>
          <div>
            <p>{groundsDTO.info}</p>
          </div>
          {/* <div className="reservation-input">예약 일정 입력</div> */}
        </div>
        <button
          className="favorite-button reservation-button"
          onClick={handleReservation}>
          예약 등록
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>예약 인원 목록</h2>
        </div>
        <div className="card-body">
          {groundsReviewsDTO ? (
            groundsReviewsDTO.map(review => (
              <div key={review.grno} className="review">
                <div className="review-header">
                  <div>{review.name}</div>
                  <div>{new Date(review.regDate).toLocaleString()}</div>
                  {review.email === sessionStorage.getItem('email') && (
                    <button onClick={() => handleDelete(review.grno)}>삭제</button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div>Loading...</div>
          )}
        </div>
      </div>
    </div>
  )
}