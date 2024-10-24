import {FormEvent, useCallback, useRef, useState, useEffect} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import useToken from '../../hooks/useToken'

interface GphotosDTO {
  uuid: string | Blob
  gphotosName: string | Blob
  path: string | Blob
}

export default function Register() {
  const [query] = useSearchParams() // url주소의 쿼리를 받을 때
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
  const refLabelFile = useRef<HTMLLabelElement | null>(null)

  const [labelFile, setLabelFile] = useState('')
  const [inputHiddens, setInputHiddens] = useState('')
  const [todayDate, setTodayDate] = useState<string>('')
  const [formattedDay, setFormattedDay] = useState<string>('') // 선택된 날짜를 저장할 state
  const [membersMid, setMembersMid] = useState<string>('') // 로그인된 사용자의 mid 저장

  // 세션 스토리지에서 mid 가져오기
  useEffect(() => {
    const storedMid = sessionStorage.getItem('mid')
    console.log(sessionStorage.getItem('mid'))
    if (storedMid) {
      setMembersMid(storedMid) // 세션 스토리지에서 가져온 mid 값 저장
    }

    const today = new Date()
    const formattedDate = today.toISOString().split('T')[0] // YYYY-MM-DD 형식으로 변환
    setTodayDate(formattedDate)
    setFormattedDay(formatDateToYYYYMMDD(today)) // 오늘 날짜를 YYYYMMDD로 변환하여 저장
  }, [])

  // 날짜를 YYYYMMDD로 변환하는 함수
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = ('0' + (date.getMonth() + 1)).slice(-2)
    const day = ('0' + date.getDate()).slice(-2)
    return `${year}${month}${day}`
  }

  // 날짜 변경 시 실행되는 함수
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value)
    const formattedDate = formatDateToYYYYMMDD(selectedDate)
    setFormattedDay(formattedDate) // YYYYMMDD로 변환된 날짜를 저장
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
    const flistLength = flist?.length ?? 0

    const tmpLabel =
      (flist?.length ?? 0) - 1 == 0 ? '' : `${fileName} 외 ${(flist?.length ?? 0) - 1}개`
    setLabelFile(tmpLabel)

    let appended = false // 파일이 잘 추가되는지 확인
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

    for (const value of formData.values()) console.log(value)
    const url = 'http://localhost:8080/api/uploadAjax'
    fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => {
        console.log(json)
        showResult(json)
      })
      .catch(err => console.log('Error: ', err))
  }, [labelFile])

  function showResult(arr: []) {
    const uploadUL = document.querySelector('.uploadResult ul')
    let str = ''
    const url = 'http://localhost:8080/api/display'
    for (let i = 0; i < arr.length; i++) {
      str += `<li data-name='${arr[i].fileName}' data-path='${arr[i].folderPath}'
      data-uuid='${arr[i].uuid}' data-file='${arr[i].photosURL}'><div>
      <button class="removeBtn" type="button">X</button>
      <img src="${url}?fileName=${arr[i].thumbnailURL}">
      </div></li>`
    }
    uploadUL.innerHTML = str
    const removeBtns = document.querySelectorAll('.removeBtn')
    for (let i = 0; i < removeBtns.length; i++) {
      removeBtns[i].onclick = function () {
        const removeUrl = 'http://localhost:8080/api/removeFile?fileName='
        const targetLi = this.closest('li')
        const fileName = targetLi.dataset.file
        console.log(fileName)
        fetch(removeUrl + fileName, {
          method: 'POST',
          dataType: 'json',
          fileName: fileName,
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(response => response.json())
          .then(json => {
            console.log(json)
            if (json === true) targetLi.remove()
            document.querySelector('#custom-label').innerHTML = ''
            document.querySelector('#fileInput').value = ''
          })
          .catch(err => console.log('Error occurred: ', err))
      }
    }
  }

  const transform = (str: string) => {
    return str.replace(/\n/g, '')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    let compare = query.get('page') // 기본적으로 페이지 1을 사용
    const page = compare === 'null' || compare == null ? '1' : compare
    compare = query.get('type')
    const type = compare === 'null' || compare == null ? '' : compare
    compare = query.get('keyword')
    const keyword = compare === 'null' || compare == null ? '' : compare

    const formData = new FormData(e.currentTarget)

    let str = ''
    const liArr = document.querySelectorAll('.uploadResult ul li')
    let arr: GphotosDTO[] = []

    for (let i = 0; i < liArr.length; i++) {
      str += `
        <input type="hidden" name="gphotosDTOList[${i}].gphotosName" value="${liArr[i].dataset.name}" />
        <input type="hidden" name="gphotosDTOList[${i}].path" value="${liArr[i].dataset.path}" />
        <input type="hidden" name="gphotosDTOList[${i}].uuid" value="${liArr[i].dataset.uuid}" />
      `
      arr.push({
        gphotosName: liArr[i].dataset.name,
        path: liArr[i].dataset.path,
        uuid: liArr[i].dataset.uuid
      })
    }
    setInputHiddens(str)

    arr.forEach((photo, index) => {
      formData.append(`phtosDTOList[${index}].uuid`, photo.uuid)
      formData.append(`phtosDTOList[${index}].gphotosName`, photo.gphotosName)
      formData.append(`phtosDTOList[${index}].path`, photo.path)
    })

    const formDataObj = {
      groundstime: refGroundsTime.current?.value ?? '',
      gtitle: refGTitle.current?.value ?? '',
      info: refInfo.current?.value ?? '',
      location: refLocation.current?.value ?? '',
      maxpeople: refMaxPeople.current?.value ?? '',
      price: refPrice.current?.value ?? '',
      sports: refSports.current?.value ?? '',
      day: formattedDay, // 선택된 날짜를 YYYYMMDD 형식으로 저장
      members_mid: membersMid, // 세션 스토리지에서 가져온 mid 추가
      gphotosDTOList: arr
    }

    let resMessage = ''
    if (token) {
      fetch('http://localhost:8080/api/grounds/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(formDataObj)
      })
        .then(res => res.text())
        .then(data => {
          console.log(data)
          resMessage = data
        })
        .catch(err => console.log('Error: ' + err))
      navigate(
        `/grounds/list?page=${page}&type=${type}&keyword=${keyword}&$msg=${resMessage}`
      )
    } else {
      navigate('/')
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        id="frmSend"
        method="post"
        action="http://localhost:8080/api/grounds/register">
        {/* 경기 시간 */}
        <div className="form-group">
          <label htmlFor="groundstime" style={{fontSize: '22px'}}>
            경기 시간
          </label>
          <input
            type="text"
            name="groundstime"
            ref={refGroundsTime}
            style={{fontSize: '22px'}}
            id="groundstime"
            className="form-control"
            placeholder="경기 시간을 입력하세요"
          />
        </div>

        {/* 구장 이름 */}
        <div className="form-group">
          <label htmlFor="gtitle" style={{fontSize: '22px'}}>
            구장 이름
          </label>
          <input
            type="text"
            name="gtitle"
            ref={refGTitle}
            style={{fontSize: '22px'}}
            id="gtitle"
            className="form-control"
            placeholder="구장 이름을 입력하세요"
          />
        </div>

        {/* 구장 정보 */}
        <div className="form-group">
          <label htmlFor="info" style={{fontSize: '22px'}}>
            구장 정보
          </label>
          <input
            type="text"
            name="info"
            ref={refInfo}
            style={{fontSize: '22px'}}
            id="info"
            className="form-control"
            placeholder="구장 정보를 입력하세요"
          />
        </div>

        {/* 장소 */}
        <div className="form-group">
          <label htmlFor="location" style={{fontSize: '22px'}}>
            장소
          </label>
          <input
            type="text"
            name="location"
            ref={refLocation}
            style={{fontSize: '22px'}}
            id="location"
            className="form-control"
            placeholder="장소를 입력하세요"
          />
        </div>

        {/* 모집 인원 */}
        <div className="form-group">
          <label htmlFor="maxpeople" style={{fontSize: '22px'}}>
            모집 인원
          </label>
          <input
            type="text"
            name="maxpeople"
            ref={refMaxPeople}
            style={{fontSize: '22px'}}
            id="maxpeople"
            className="form-control"
            placeholder="모집 인원을 입력하세요"
          />
        </div>

        {/* 가격 */}
        <div className="form-group">
          <label htmlFor="price" style={{fontSize: '22px'}}>
            가격
          </label>
          <input
            type="text"
            name="price"
            ref={refPrice}
            style={{fontSize: '22px'}}
            id="price"
            className="form-control"
            placeholder="가격을 입력하세요"
          />
        </div>

        {/* 종목 */}
        <div className="form-group">
          <label htmlFor="sports" style={{fontSize: '22px'}}>
            종목
          </label>
          <input
            type="text"
            name="sports"
            ref={refSports}
            style={{fontSize: '22px'}}
            id="sports"
            className="form-control"
            placeholder="종목을 입력하세요"
          />
        </div>

        {/* Day (달력 필드) */}
        <div className="form-group">
          <label htmlFor="day" style={{fontSize: '22px'}}>
            Day
          </label>
          <input
            type="date"
            name="day"
            style={{fontSize: '22px'}}
            id="day"
            className="form-control"
            defaultValue={todayDate} // 기본값으로 오늘 날짜 설정
            onChange={handleDateChange} // 날짜 변경 시 처리
          />
        </div>

        {/* 파일 선택 */}
        <div className="form-group">
          <label
            htmlFor="fileInput"
            style={{fontSize: '22px'}}
            ref={refLabelFile}
            defaultValue={labelFile ?? ''}>
            Select Image Files
          </label>
          <input
            type="file"
            id="fileInput"
            ref={refFile}
            style={{fontSize: '22px'}}
            onChange={fileChange}
            className="custom-file-input form-control files"
            multiple></input>
          <label id="custom-label"></label>
        </div>

        {/* Hidden Inputs */}
        <div
          className="box"
          dangerouslySetInnerHTML={{__html: transform(inputHiddens)}}></div>

        {/* Submit 버튼 */}
        <div className="form-group">
          <button
            type="submit"
            id="btnSend"
            className="btn btn-secondary"
            style={{
              fontSize: '30px',
              background: 'white',
              color: 'bd5d38',
              border: '1px solid #bd5d38'
            }}>
            Submit
          </button>
        </div>
      </form>

      {/* 업로드 결과 */}
      <div className="uploadResult">
        <ul></ul>
      </div>
    </>
  )
}
