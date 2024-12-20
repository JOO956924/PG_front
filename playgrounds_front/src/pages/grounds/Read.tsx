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

// PageResultDTO 구조 정의
interface PageResultDTO {
  dtoList: GroundsDTO[]
  page: number
  start: number
  end: number
  pageList: number[]
  prev: boolean
  next: boolean
}

// GroundsReviews 데이터 구조 정의
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
  const location = useLocation() // 현재 URL 정보를 가져오기 위한 useLocation 사용
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
    day: '' // day 값을 관리
  })

  const [pageResultDTO, setPageResultDTO] = useState<PageResultDTO | null>(null)
  const [keywords, setKeywords] = useState(query.get('keyword') || '')
  const [types, setTypes] = useState(query.get('type') || '')
  const [selectedDay, setSelectedDay] = useState(query.get('day') || '') // URL에서 day 값을 가져와서 유지

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

  const goModify = (gno: number) => {
    navigate(
      `/grounds/modify?gno=${gno}&page=${pageRequestDTO.page}&type=${
        pageRequestDTO.type
      }&keyword=${pageRequestDTO.keyword}&day=${selectedDay || query.get('day')}`
    )
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
      {/* 오른쪽 상단 수정 버튼 */}
      <button className="modify-button" onClick={() => goModify(groundsDTO.gno)}>
        수정
      </button>

      {/* 상단 캐러셀 */}
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

      {/* 경기장 정보 */}
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
              <p>Reservation: {groundsDTO.reservation}</p>
              <p>Grounds Time: {groundsDTO.groundstime}</p>
              <p>Info: {groundsDTO.info}</p>
              <p>Price: {groundsDTO.price}</p>
              <p>Max People: {groundsDTO.maxpeople}</p>
              {/* <p>Now People: {groundsDTO.nowpeople}</p> */}
              <p>Registered Date: {new Date(groundsDTO.regDate).toLocaleString()}</p>
              <p>Modified Date: {new Date(groundsDTO.modDate).toLocaleString()}</p>
            </div>
          </div>
          <div className="card-description">경기장 설명 및 대여 규정</div>
          <div className="reservation-input">예약 일정 입력</div>
        </div>
      </div>

      {/* 리뷰 */}
      <div className="card">
        <div className="card-header">
          <h2>구장 예약</h2>
          <button className="write-review-button">예약 등록</button>
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
