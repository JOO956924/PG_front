import {useEffect, useRef, useState, FormEvent} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
// import {useReservationContext} from '../../contexts/ReservationContext'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import Calendar from '../../components/Calendar'
import useToken from '../../hooks/useToken'
import './List.css'

// Grounds 데이터 구조 정의
interface Grounds {
  gno: number
  gtitle: string
  gphotosDTOList: {path: string}[]
  reviewsCnt: number
  likes: number
  regDate: string
  day: number
  groundsTime: string
  location: string
  sports: string
  maxpeople: number
}

// PageRequestDTO 구조 정의
interface PageRequestDTO {
  page: string
  size: string
  type: string
  keyword: string
  day?: string // day 필드 추가
}

// PageResultDTO 구조 정의
interface PageResultDTO {
  dtoList: Grounds[]
  page: number
  start: number
  end: number
  pageList: number[]
  prev: boolean
  next: boolean
}

// 날짜 형식을 변환하는 함수
const formatDate = (dateString: string) => {
  const year = dateString.substring(0, 4)
  const month = dateString.substring(4, 6)
  const day = dateString.substring(6, 8)

  const date = new Date(`${year}-${month}-${day}`)
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = weekDays[date.getDay()]

  return `${month}월 ${day}일 (${dayOfWeek})`
}

export default function List() {
  const token = useToken()
  const navigate = useNavigate()
  const [query, setQuery] = useSearchParams()
  const refType = useRef<HTMLSelectElement | null>(null)
  const refKeyword = useRef<HTMLInputElement | null>(null)
  // const {reservationCounts} = useReservationContext() // 추가됨

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
  const [reservationCounts, setReservationCounts] = useState<{[key: number]: number}>({}) // 각 구장의 예약 인원을 저장할 상태
  const [isRegisterHidden, setIsRegisterHidden] = useState(false) // Register 버튼 숨김 여부 상태

  useEffect(() => {
    if (token) {
      // 권한 정보를 가져와 console.log에 출력
      fetchUserRoles()

      const page = query.get('page') || '1'
      const type = query.get('type') || ''
      const keyword = query.get('keyword') || ''
      const day = query.get('day') || selectedDay // 항상 day 값을 유지

      let url = `http://localhost:8080/api/grounds/list?page=${page}&type=${type}&keyword=${keyword}&day=${day}`

      fetch(url, {
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
          setPageRequestDTO(data.pageRequestDTO)
          setPageResultDTO(data.pageResultDTO)

          // 구장의 예약 인원을 별도 API 호출로 가져옴
          data.pageResultDTO.dtoList.forEach((ground: Grounds) => {
            fetchReservationCount(ground.gno)
          })
        })
        .catch(err => console.log('Error:', err))
    }
  }, [query, token, selectedDay])

  // 사용자 권한 정보를 가져와 console.log에 출력하는 함수
  const fetchUserRoles = () => {
    fetch(
      `http://localhost:8080/api/members/user/roles?email=${sessionStorage.getItem(
        'email'
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        console.log('User Roles:', data) // roleSet 콘솔에 출력
        // roleSet이 0을 포함하면 Register 버튼을 숨김 처리
        setIsRegisterHidden(data.includes(0))
      })
      .catch(err => console.log('Error fetching user roles:', err))
  }

  const fetchReservationCount = (gno: number) => {
    // 각 구장의 예약 인원을 가져오는 함수
    fetch(`http://localhost:8080/api/greviews/all/${gno}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setReservationCounts(prev => ({...prev, [gno]: data.length})) // 예약 인원을 상태에 저장
      })
      .catch(err => console.log(`Error fetching reservation count for gno ${gno}:`, err))
  }

  const handleSearch = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    // 검색할 때 day 값을 유지하면서 새로운 검색 조건을 적용
    setQuery({
      page: '1',
      type: types,
      keyword: keywords,
      day: selectedDay || query.get('day') || '' // day 값 유지
    })
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypes(e.target.value)
    setQuery({
      page: '1',
      type: e.target.value,
      keyword: keywords,
      day: selectedDay || query.get('day') || '' // day 값 유지
    })
  }

  const goRead = (gno: number) => {
    navigate(
      `/grounds/read?gno=${gno}&page=${pageRequestDTO.page}&type=${
        pageRequestDTO.type
      }&keyword=${pageRequestDTO.keyword}&day=${selectedDay || query.get('day')}`
    )
  }

  const goRegister = () => {
    navigate(
      `/grounds/register?page=${pageRequestDTO.page}&type=${
        pageRequestDTO.type
      }&keyword=${pageRequestDTO.keyword}&day=${selectedDay || query.get('day')}`
    )
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
      <Slider {...sliderSettings}>
        <div className="carousel-slide">
          <img
            src="/sisul_01_04_01.jpg"
            alt="슬라이드 이미지 1"
            style={{width: '100%', height: 'auto', objectFit: 'cover'}}
          />
        </div>
        <div className="carousel-slide">
          <img
            src="/sisul_01_04_02.jpg"
            alt="슬라이드 이미지 2"
            style={{width: '100%', height: 'auto', objectFit: 'cover'}}
          />
        </div>
      </Slider>

      <Calendar selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      <form method="GET" className="search-form">
        <div className="input-group">
          <select
            className="form-control"
            style={{fontSize: '22px'}}
            ref={refType}
            name="type"
            value={types}
            onChange={handleTypeChange}>
            <option value="">선택하세요</option>
            <option value="t">구장이름</option>
            <option value="c">종목</option>
            <option value="w">지역</option>
          </select>

          <input
            type="text"
            className="form-control"
            name="keyword"
            style={{fontSize: '22px'}}
            ref={refKeyword}
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            disabled={types === ''} // type이 "선택하세요"일 경우 비활성화
          />

          <button
            type="button"
            className="btn btn-outline-primary"
            style={{fontSize: '30px', marginLeft: '10px'}}
            onClick={handleSearch}
            disabled={types === ''} // type이 "선택하세요"일 경우 비활성화
          >
            Search
          </button>
          {!isRegisterHidden && ( // Register 버튼을 조건부로 렌더링
            <button
              type="button"
              className="btn btn-outline-secondary"
              style={{
                fontSize: '30px',
                marginLeft: '10px',
                background: 'white',
                color: '#bd5d38',
                border: '1px solid #bd5d38'
              }}
              onClick={goRegister}>
              Register
            </button>
          )}
        </div>
      </form>

      <div className="card-list">
        {pageResultDTO?.dtoList
          .sort((a, b) => a.groundstime.localeCompare(b.groundstime))
          .map(ground => (
            <div key={ground.gno} className="card-row">
              <div className="ground-time">{formatDate(ground.day.toString())}</div>
              <div
                className="card-info"
                onClick={() =>
                  goRead(
                    ground.gno,
                    pageResultDTO.page,
                    pageRequestDTO.type,
                    pageRequestDTO.keyword
                  )
                }>
                <div className="card-content">
                  <span className="game-schedule">경기 시간: {ground.groundstime}</span>
                  <span className="game-info">구장명: {ground.gtitle}</span>
                  <span className="sports-info">종목: {ground.sports}</span>
                  <span className="location-info">위치: {ground.location}</span>
                  <span>예약 인원: {reservationCounts[ground.gno] || 0} 명</span>{' '}
                </div>
                <div className="card-button">
                  <span className="people-info">모집 인원: {ground.maxpeople}</span>
                </div>
              </div>
            </div>
          ))}
      </div>

      <ul
        className={`pagination ${
          pageResultDTO && pageResultDTO.pageList.length > 1 ? '' : 'hidden'
        }`}>
        {pageResultDTO?.prev && (
          <li className="page-item">
            <a
              className="page-link"
              href={`/grounds/list?page=${pageResultDTO.start - 1}&day=${
                selectedDay || query.get('day')
              }`}>
              Prev
            </a>
          </li>
        )}
        {pageResultDTO?.pageList.map(page => (
          <li
            key={page}
            className={`page-item ${pageResultDTO.page === page ? 'active' : ''}`}>
            <a
              className="page-link"
              href={`/grounds/list?page=${page}&type=${query.get(
                'type'
              )}&keyword=${query.get('keyword')}&day=${selectedDay || query.get('day')}`}>
              {page}
            </a>
          </li>
        ))}
        {pageResultDTO?.next && (
          <li className="page-item">
            <a
              className="page-link"
              href={`/grounds/list?page=${pageResultDTO.end + 1}&day=${
                selectedDay || query.get('day')
              }`}>
              Next
            </a>
          </li>
        )}
      </ul>
    </div>
  )
}
