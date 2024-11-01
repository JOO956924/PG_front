import React, {useState, useEffect} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'

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
    } else if (selectedDay === null) {
      // URL에 'day'가 없고, selectedDay가 null일 때만 오늘 날짜로 설정
      const todayDay = today.getDate()
      navigate(
        `/grounds/list?day=${today.getFullYear()}${String(today.getMonth() + 1).padStart(
          2,
          '0'
        )}${String(todayDay).padStart(2, '0')}&page=1`
      )
      setSelectedDay(todayDay) // 오늘의 day를 선택
    }
  }, [searchParams, navigate, today, selectedDay])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1)
    setCurrentDate(newDate)

    if (delta > 0) {
      setSelectedDay(1)
      navigate(
        `/grounds/list?day=${newDate.getFullYear()}${String(
          newDate.getMonth() + 1
        ).padStart(2, '0')}01&page=1`
      )
    } else {
      const lastDay = new Date(year, month + delta + 1, 0).getDate()
      setSelectedDay(lastDay)
      navigate(
        `/grounds/list?day=${newDate.getFullYear()}${String(
          newDate.getMonth() + 1
        ).padStart(2, '0')}${String(lastDay).padStart(2, '0')}&page=1`
      )
    }
  }

  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const dayString = String(day).padStart(2, '0')

    const formattedDate = `${year}${month}${dayString}`

    const currentKeyword = searchParams.get('keyword') || ''
    navigate(`/grounds/list?day=${formattedDate}&keyword=${currentKeyword}&page=1`)
    setSelectedDay(day)
  }

  const renderDays = () => {
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{padding: '10px'}}></div>)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = i === selectedDay
      days.push(
        <div
          key={i}
          onClick={() => handleDayClick(i)}
          style={{
            textAlign: 'center',
            padding: '10px',
            borderRadius: '50%',
            backgroundColor: isSelected ? '#ddd' : '#fff',
            color: isSelected ? '#333' : '#333',
            fontWeight: isSelected ? 'bold' : 'normal',
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
