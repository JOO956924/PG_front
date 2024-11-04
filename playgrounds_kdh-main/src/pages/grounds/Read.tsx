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
  regDate: string
  modDate: string
}

interface GphotosDTO {
  uuid: string
  gphotosName: string
  path: string
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

interface MembersDTO {
  mid: number
  email: string
  likes: string
  nowcash: number
  addcash: number
  name: string
}

export default function Read() {
  const email = sessionStorage.getItem('email')?.trim() || ''
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
  const [isModifyHidden, setIsModifyHidden] = useState(false) // 수정 버튼 숨김 여부 상태
  const addDefaultImg = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultImg
  }
  const isFullyBooked =
    groundsReviewsDTO && groundsReviewsDTO.length >= (groundsDTO?.maxpeople || 0)

  const formatImageUrl = (photo: GphotosDTO): string => {
    return `http://localhost:8080/api/display?fileName=${encodeURI(
      `${photo.path}/${photo.uuid}_${photo.gphotosName}`
    )}`
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
        .then(res => res.json())
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
        .then(res => res.json())
        .then(data => {
          setGroundsReviewsDTO(data)
        })
        .catch(err => console.log('Error:', err))
    }
  }, [gno, token])

  useEffect(() => {
    if (token) {
      fetchUserRoles()
    }
  }, [token])

  // 사용자 권한 정보를 가져와 수정 버튼의 가시성을 설정하는 함수
  const fetchUserRoles = () => {
    const email = sessionStorage.getItem('email')
    if (!email) return

    fetch(`http://localhost:8080/api/members/user/roles?email=${email}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setIsModifyHidden(data.includes(0))
      })
      .catch(err => console.log('Error fetching user roles:', err))
  }

  const goModify = (gno: number) => {
    navigate(
      `/grounds/modify?gno=${gno}&page=${pageRequestDTO.page}&type=${
        pageRequestDTO.type
      }&keyword=${pageRequestDTO.keyword}&day=${selectedDay || query.get('day')}`
    )
  }

  const handleReservation = () => {
    if (isFullyBooked) {
      alert('예약이 만석입니다.')
      return
    }
    const email = sessionStorage.getItem('email')
    if (!email || !gno) {
      alert('로그인이 필요합니다.')
      return
    }

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
      .then(res => res.json())
      .then(memberData => {
        const groundsPrice = groundsDTO.price
        const nowCash = memberData.nowcash

        if (nowCash < groundsPrice) {
          alert('캐쉬가 부족합니다. 충전해 주세요.')
          return
        }

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
          .then(res => res.json())
          .then(data => {
            alert('예약이 성공적으로 등록되었습니다.')
            setGroundsReviewsDTO(prev => [...(prev || []), data])

            return fetch(`http://localhost:8080/api/members/charge`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({email, addcash: -groundsPrice})
            })
          })
          .then(() => {
            handleFavorite()
          })
          .catch(err => console.log('Error:', err))
      })
      .catch(err => console.log('Error:', err))
  }
  const handleFavorite = () => {
    const email = sessionStorage.getItem('email')
    if (!email) {
      alert('로그인이 필요합니다.')
      return
    }

    fetch(`http://localhost:8080/api/members/email/${email}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(memberData => {
        if (memberData.likes && memberData.likes.includes(groundsDTO.gtitle)) {
          alert('이미 즐겨찾기에 추가된 구장입니다.')
          return
        }

        fetch(`http://localhost:8080/api/members/updateLikes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({email, gno})
        })
          .then(response => {
            if (response.ok) {
              window.location.reload() // 즐겨찾기 추가 후 페이지 새로고침
            } else {
              alert('예약구장 목록 추가에 실패했습니다.')
            }
          })
          .catch(err => console.log('Error:', err))
      })
      .catch(err => console.log('Error:', err))
  }

  const handleDelete = async (grno: number) => {
    try {
      await fetch(`http://localhost:8080/api/greviews/${groundsDTO.gno}/${grno}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const email = sessionStorage.getItem('email')
      if (email) {
        const groundsPrice = groundsDTO.price
        await fetch(`http://localhost:8080/api/members/charge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({email, addcash: groundsPrice})
        })
      }

      setGroundsReviewsDTO(prev => prev?.filter(review => review.grno !== grno) || null)
      alert('예약이 성공적으로 취소되었습니다.')
      if (email) {
        const removeLikeResponse = await fetch(
          `http://localhost:8080/api/members/removeLike`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({email, gno})
          }
        )

        if (!removeLikeResponse.ok) {
          alert('즐겨찾기 제거에 실패했습니다.')
        }
      }
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
      {groundsDTO?.email === email && (
        <button className="modify-button" onClick={() => goModify(groundsDTO.gno)}>
          수정
        </button>
      )}

      {groundsDTO && groundsDTO.gphotosDTOList.length > 0 ? (
        groundsDTO.gphotosDTOList.length > 1 ? (
          <div className="slider-container">
            <Slider {...sliderSettings}>
              {groundsDTO.gphotosDTOList.map((photo, index) => (
                <div key={index}>
                  <img
                    src={formatImageUrl(photo)}
                    alt="Ground Image"
                    className="ground-image"
                    onError={addDefaultImg}
                  />
                </div>
              ))}
            </Slider>
          </div>
        ) : (
          <div className="image-container">
            <img
              src={formatImageUrl(groundsDTO.gphotosDTOList[0])}
              alt="Ground Image"
              className="ground-image"
              onError={addDefaultImg}
            />
          </div>
        )
      ) : (
        <div className="image-container">
          <img src={defaultImg} alt="Default Image" className="ground-image" />
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <button
            className="favorite-button"
            style={{display: 'none'}}
            onClick={handleFavorite}>
            즐겨찾기
          </button>
        </div>
        <div className="card-body">
          <div className="ground-details">
            <div>
              <h1>{groundsDTO.gtitle}</h1>
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
        </div>
        {!isFullyBooked ? (
          <button className="reservation-button" onClick={handleReservation}>
            예약 등록
          </button>
        ) : (
          <div className="fully-booked" style={{textAlign: 'center'}}>
            예약 마감
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>
            <p>예약 인원: {groundsReviewsDTO ? groundsReviewsDTO.length : 0} 명</p>{' '}
          </h2>
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
