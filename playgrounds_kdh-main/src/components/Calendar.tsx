import React, {useState, useEffect} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom' // useNavigate, useSearchParams 사용

const Calendar = () => {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today) // 현재 월 관리
  const [selectedDay, setSelectedDay] = useState<number | null>(null) // 선택된 day 관리
  const navigate = useNavigate()
  const [searchParams] = useSearchParams() // URL의 쿼리 파라미터에서 검색된 day 가져오기

  useEffect(() => {
    // 처음 로드 시 검색된 'day' 값 가져오기
    const dayFromQuery = searchParams.get('day')
    if (dayFromQuery) {
      const extractedDay = parseInt(dayFromQuery.slice(-2)) // 마지막 두 자리(day) 추출
      setSelectedDay(extractedDay)
    } else {
      const todayDay = today.getDate()
      navigate(
        `/grounds/list?day=${today.getFullYear()}${String(today.getMonth() + 1).padStart(
          2,
          '0'
        )}${String(todayDay).padStart(2, '0')}&page=1`
      ) // 오늘의 day로 검색
      setSelectedDay(todayDay) // 오늘의 day를 선택
    }
  }, [searchParams, navigate, today])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0부터 시작 (0: 1월)
  const firstDay = new Date(year, month, 1).getDay() // 해당 월 첫째 날의 요일
  const daysInMonth = new Date(year, month + 1, 0).getDate() // 해당 월의 일 수

  // 월 변경 함수: 다음달, 지난달로 이동하고 검색 쿼리 리셋
  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1)
    setCurrentDate(newDate)

    if (delta > 0) {
      // 다음달로 가면 첫번째 날 선택
      setSelectedDay(1)
      navigate(
        `/grounds/list?day=${newDate.getFullYear()}${String(
          newDate.getMonth() + 1
        ).padStart(2, '0')}01&page=1`
      )
    } else {
      // 지난달로 가면 마지막 날 선택
      const lastDay = new Date(year, month + delta + 1, 0).getDate()
      setSelectedDay(lastDay)
      navigate(
        `/grounds/list?day=${newDate.getFullYear()}${String(
          newDate.getMonth() + 1
        ).padStart(2, '0')}${String(lastDay).padStart(2, '0')}&page=1`
      )
    }
  }

  // 날짜 클릭 시 해당 '년도(year)', '월(month)', '일(day)' 값을 YYYYMMDD 형식으로 검색
  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0') // month는 0부터 시작하므로 1을 더하고, 한 자리수일 때 앞에 0을 붙임
    const dayString = String(day).padStart(2, '0') // day도 한 자리수일 때 앞에 0을 붙임

    const formattedDate = `${year}${month}${dayString}` // YYYYMMDD 형식으로 날짜 생성

    // 기존 쿼리 파라미터 유지한 상태로 새로운 날짜 검색
    const currentKeyword = searchParams.get('keyword') || ''

    navigate(`/grounds/list?day=${formattedDate}&keyword=${currentKeyword}&page=1`) // YYYYMMDD 형식으로 검색
    setSelectedDay(day) // 선택된 날짜로 설정
  }

  // 날짜 렌더링
  const renderDays = () => {
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{padding: '10px'}}></div>)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = i === selectedDay // 검색된 day 값으로 강조
      days.push(
        <div
          key={i}
          onClick={() => handleDayClick(i)} // 날짜 클릭 이벤트 추가
          style={{
            textAlign: 'center',
            padding: '10px',
            borderRadius: '50%',
            backgroundColor: isSelected ? '#ddd' : '#fff', // 선택된 날짜일 경우 색상 강조
            color: isSelected ? '#333' : '#333', // 글자 색상
            fontWeight: isSelected ? 'bold' : 'normal', // 선택된 날짜일 경우 폰트 굵게
            fontSize: '16px',
            border: isSelected ? '2px solid #333' : '1px solid #ccc',
            cursor: 'pointer'
          }}>
          {i}
        </div>
      )
    }
    return days
  }

  return (
    <div
      style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '10px',
        width: 'fit-content',
        margin: '0 auto'
      }}>
      <div
        style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
        <button onClick={() => changeMonth(-1)}>◀</button>
        <span>
          {year}년 {month + 1}월
        </span>
        <button onClick={() => changeMonth(1)}>▶</button>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px'}}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
          <div key={idx} style={{textAlign: 'center', padding: '10px', fontSize: '16px'}}>
            {day}
          </div>
        ))}
        {renderDays()}
      </div>
    </div>
  )
}

export default Calendar
