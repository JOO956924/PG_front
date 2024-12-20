import {FormEvent, useCallback, useEffect, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import useToken from '../../hooks/useToken'
import './modify.css'

interface GphotosDTO {
  uuid: string | Blob
  gphotosName: string | Blob
  path: string | Blob
}

export default function ModifyGround() {
  const [query] = useSearchParams()
  const token = useToken()
  const navigate = useNavigate()

  const refGroundsTime = useRef<HTMLInputElement | null>(null)
  const refGTitle = useRef<HTMLInputElement | null>(null)
  const refInfo = useRef<HTMLInputElement | null>(null)
  const refLocation = useRef<HTMLInputElement | null>(null)
  const refMaxPeople = useRef<HTMLInputElement | null>(null)
  const refPrice = useRef<HTMLInputElement | null>(null)
  const refSports = useRef<HTMLInputElement | null>(null)
  const refFile = useRef<HTMLInputElement | null>(null)

  const [labelFile, setLabelFile] = useState('')
  const [formattedDay, setFormattedDay] = useState<string>('')
  const [todayDate, setTodayDate] = useState<string>('')
  const [membersMid, setMembersMid] = useState<string>('')
  const [email, setEmail] = useState<string | null>(null) // email 상태 추가

  const gno = query.get('gno')

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = ('0' + (date.getMonth() + 1)).slice(-2)
    const day = ('0' + date.getDate()).slice(-2)
    return `${year}${month}${day}`
  }

  useEffect(() => {
    const storedMid = sessionStorage.getItem('mid')
    const storedEmail = sessionStorage.getItem('email') // 세션에서 email 가져오기
    if (storedMid) setMembersMid(storedMid)
    if (storedEmail) setEmail(storedEmail) // email 상태에 저장

    const today = new Date()
    const formattedToday = today.toISOString().split('T')[0]
    setTodayDate(formattedToday)
    setFormattedDay(formatDateToYYYYMMDD(today))

    if (gno && token) {
      fetch(`http://localhost:8080/api/grounds/read/${gno}`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${token}`}
      })
        .then(res => {
          if (!res.ok) throw new Error('구장 데이터를 가져오는데 실패했습니다.')
          return res.json()
        })
        .then(data => {
          const ground = data.groundsDTO
          refGroundsTime.current!.value = ground.groundstime
          refGTitle.current!.value = ground.gtitle
          refInfo.current!.value = ground.info
          refLocation.current!.value = ground.location
          refMaxPeople.current!.value = String(ground.maxpeople)
          refPrice.current!.value = String(ground.price)
          refSports.current!.value = ground.sports
          setFormattedDay(ground.day)

          // 기존 사진을 썸네일로 표시
          showResult(ground.gphotosDTOList || [])
        })
        .catch(err => console.error('구장 로딩 오류:', err))
    }
  }, [gno, token])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value)
    const formattedDate = formatDateToYYYYMMDD(selectedDate)
    setFormattedDay(formattedDate)
  }

  const checkExtension = useCallback((fileName: string, fileSize: number) => {
    const maxSize = 1024 * 1024 * 10
    if (fileSize >= maxSize) {
      alert('파일사이즈 초과')
      return false
    }
    const regex = new RegExp('(.*?).(jpg|jpeg|png|gif|bmp|pdf)$', 'i')
    if (!regex.test(fileName)) {
      alert('해당파일 업로드 금지!')
      return false
    }
    return true
  }, [])

  const fileChange = useCallback(() => {
    const formData = new FormData()
    const fileName = refFile.current?.value.split('\\').pop()
    const flist = refFile.current?.files ?? []
    const flistLength = flist.length

    const tmpLabel = flistLength - 1 === 0 ? '' : `${fileName} 외 ${flistLength - 1}개`
    setLabelFile(tmpLabel)

    let appended = false
    for (let i = 0; i < flistLength; i++) {
      if (!checkExtension(flist[i].name, flist[i].size)) {
        if (refFile?.current?.value !== undefined) refFile.current.value = ''
        appended = false
        break
      }
      formData.append('uploadFiles', flist[i])
      appended = true
    }
    if (!appended) return

    formData.append('members_mid', membersMid)

    fetch('http://localhost:8080/api/uploadAjax', {
      method: 'POST',
      body: formData,
      headers: {Authorization: `Bearer ${token}`}
    })
      .then(res => res.json())
      .then(json => showResult(json))
      .catch(err => console.log('파일 업로드 오류:', err))
  }, [labelFile, membersMid, token])

  function showResult(arr: []) {
    const uploadUL = document.querySelector('.uploadResult ul')
    if (!uploadUL) {
      console.error('Upload result element not found.')
      return
    }

    let str = ''
    const url = 'http://localhost:8080/api/display'
    for (let i = 0; i < arr.length; i++) {
      const fileName = arr[i].fileName || '' // 여기서 값이 없으면 빈 문자열로 설정
      const folderPath = arr[i].folderPath || ''
      const uuid = arr[i].uuid || ''
      const thumbnailURL = arr[i].thumbnailURL || ''

      str += `<li data-name='${fileName}' data-path='${folderPath}' data-uuid='${uuid}' data-file='${thumbnailURL}'>
                <div>
                  <button class="removeBtn" type="button">X</button>
                  <img src="${url}?fileName=${thumbnailURL}">
                </div>
              </li>`
    }
    uploadUL.innerHTML = str

    const removeBtns = document.querySelectorAll('.removeBtn')
    for (let i = 0; i < removeBtns.length; i++) {
      removeBtns[i].onclick = function () {
        const removeUrl = 'http://localhost:8080/api/removeFile?fileName='
        const targetLi = this.closest('li')
        if (!targetLi) return

        const fileName = targetLi.dataset.file || '' // fileName이 빈 값일 때 처리
        if (!fileName) {
          console.error('File name is undefined.')
          return
        }

        fetch(removeUrl + fileName, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(response => response.json())
          .then(json => {
            if (json === true) targetLi.remove()
            const customLabel = document.querySelector('#custom-label')
            const fileInput = document.querySelector('#fileInput')
            if (customLabel) customLabel.innerHTML = ''
            if (fileInput) fileInput.value = ''
          })
          .catch(err => console.log('Error occurred: ', err))
      }
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const fields = [
      {ref: refGroundsTime, name: '경기 시간'},
      {ref: refGTitle, name: '구장 이름'},
      {ref: refInfo, name: '구장 정보'},
      {ref: refLocation, name: '장소'},
      {ref: refMaxPeople, name: '모집 인원'},
      {ref: refPrice, name: '가격'},
      {ref: refSports, name: '종목'}
    ]

    for (const field of fields) {
      if (!field.ref.current?.value) {
        alert(`${field.name}을(를) 입력하세요.`)
        field.ref.current?.focus()
        return
      }
    }

    const liArr = document.querySelectorAll('.uploadResult ul li')
    const gphotosDTOList: GphotosDTO[] = Array.from(liArr).map(li => ({
      uuid: li.dataset.uuid || '',
      gphotosName: li.dataset.name || '',
      path: li.dataset.path || ''
    }))

    const formDataObj = {
      gno,
      groundstime: refGroundsTime.current?.value ?? '',
      gtitle: refGTitle.current?.value ?? '',
      info: refInfo.current?.value ?? '',
      location: refLocation.current?.value ?? '',
      maxpeople: refMaxPeople.current?.value ?? '',
      price: refPrice.current?.value ?? '',
      sports: refSports.current?.value ?? '',
      day: formattedDay,
      members_mid: membersMid,
      email,
      gphotosDTOList
    }

    fetch('http://localhost:8080/api/grounds/modify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(formDataObj)
    })
      .then(res => res.text())
      .then(data => navigate(`/grounds/read?gno=${gno}`))
      .catch(err => console.log('구장 수정 오류:', err))
  }

  const handleDelete = useCallback(() => {
    if (window.confirm('정말로 이 글을 삭제하시겠습니까?')) {
      fetch(`http://localhost:8080/api/grounds/remove/${gno}`, {
        method: 'POST', // POST 방식 유지
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({pageRequestDTO: {}}) // PageRequestDTO를 필요 시 전달
      })
        .then(res => {
          if (!res.ok) throw new Error('구장 삭제에 실패했습니다.')
          navigate('/grounds/list')
        })
        .catch(err => console.error('구장 삭제 오류:', err))
    }
  }, [gno, token, navigate])

  return (
    <div
      style={{
        paddingTop: '60px', // 상단 여백
        padding: '0 15%',
        overflowY: 'auto',
        maxHeight: '100%',
        maxWidth: '100%',
        width: '900px' // 너비를 600px로 고정
      }}>
      <form onSubmit={handleSubmit} id="frmModify">
        <div className="form-group">
          <label htmlFor="groundstime">경기 시간</label>
          <input
            type="time"
            name="groundstime"
            ref={refGroundsTime}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="gtitle">구장 이름</label>
          <input type="text" name="gtitle" ref={refGTitle} className="form-control" />
        </div>

        <div className="form-group">
          <label htmlFor="info">구장 정보</label>
          <input type="text" name="info" ref={refInfo} className="form-control" />
        </div>

        <div className="form-group">
          <label htmlFor="location">장소</label>
          <input type="text" name="location" ref={refLocation} className="form-control" />
        </div>

        <div className="form-group">
          <label htmlFor="maxpeople">모집 인원</label>
          <input
            type="number"
            name="maxpeople"
            ref={refMaxPeople}
            className="form-control"
            min="1" // 최소 1 이상의 값만 입력 가능
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">가격</label>
          <input
            type="number"
            name="price"
            ref={refPrice}
            className="form-control"
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sports">종목</label>
          <input type="text" name="sports" ref={refSports} className="form-control" />
        </div>

        <div className="form-group">
          <label htmlFor="day">Day</label>
          <input
            type="date"
            id="day"
            className="form-control"
            defaultValue={todayDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="fileInput">새 이미지 파일 선택</label>
          <input
            type="file"
            id="fileInput"
            ref={refFile}
            onChange={fileChange}
            className="form-control"
            multiple
          />
          <label>{labelFile}</label>
        </div>

        {/* 업로드된 사진 미리보기 */}
        <div className="uploadResult">
          <ul></ul>
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary">
            변경 사항 저장
          </button>
          <button type="button" onClick={handleDelete} className="btn btn-danger">
            글 삭제
          </button>
        </div>
      </form>
    </div>
  )
}
