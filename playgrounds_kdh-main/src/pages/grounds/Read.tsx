import {SyntheticEvent, useEffect, useState} from 'react'
import {useNavigate, useSearchParams, useLocation} from 'react-router-dom'
import useToken from '../../hooks/useToken'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import defaultImg from '../../assets/no-img.gif'
import './read.css'

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

    // 동일한 사람의 중복 예약 확인
    if (groundsReviewsDTO && groundsReviewsDTO.some(review => review.email === email)) {
      alert('이미 예약이 존재합니다.')
      return
    }

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
          })
          .catch(err => console.log('Error:', err))
      })
      .catch(err => console.log('Error:', err))
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
        {groundsDTO.gphotosDTOList.length === 1 ? (
          <img
            src={`http://localhost:8080/api/display?fileName=${groundsDTO.gphotosDTOList[0].path}`}
            alt="단일 이미지"
            className="single-image"
            onError={addDefaultImg}
            style={{width: '100%', height: 'auto', objectFit: 'cover'}}
          />
        ) : (
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
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="ground-title">{groundsDTO.gtitle}</div>
          <button className="favorite-button">즐겨찾기</button>
        </div>
        <div className="card-body">
          <div className="ground-details">
            <div>
              <h1>{groundsDTO.gtitle}</h1>
              <p>Location: {groundsDTO.location}</p>
              <p>Sports: {groundsDTO.sports}</p>
              <p>Grounds Time: {groundsDTO.groundstime}</p>
              <p>Price: {groundsDTO.price}</p>
              <p>Max People: {groundsDTO.maxpeople}</p>
              <p>Registered Date: {new Date(groundsDTO.regDate).toLocaleString()}</p>
              <p>Modified Date: {new Date(groundsDTO.modDate).toLocaleString()}</p>
            </div>
          </div>
          <div className="card-description">경기장 설명 및 대여 규정</div>
          <div>
            <p>Info: {groundsDTO.info}</p>
          </div>
          <div className="reservation-input">예약 일정 입력</div>
        </div>
      </div>

      <button className="reservation-button" onClick={handleReservation}>
        예약 등록
      </button>

      <div className="card">
        <div className="card-header">
          <h2>구장 예약</h2>
        </div>
        <div className="card-body">
          {groundsReviewsDTO ? (
            groundsReviewsDTO.map(review => (
              <div key={review.grno} className="review">
                <div className="review-header">
                  <div>{review.name}</div>
                  <div>{new Date(review.regDate).toLocaleString()}</div>
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
