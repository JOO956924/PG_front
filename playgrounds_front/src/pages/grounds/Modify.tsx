import {FormEvent, useCallback, useEffect, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import useToken from '../../hooks/useToken'

interface GphotosDTO {
  uuid: string | Blob
  gphotosName: string | Blob
  path: string | Blob
  thumbnailURL?: string | Blob
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
  const [existingPhotos, setExistingPhotos] = useState<GphotosDTO[]>([])

  const gno = query.get('gno')

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = ('0' + (date.getMonth() + 1)).slice(-2)
    const day = ('0' + date.getDate()).slice(-2)
    return `${year}${month}${day}`
  }

  useEffect(() => {
    const storedMid = sessionStorage.getItem('mid')
    if (storedMid) setMembersMid(storedMid)

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
          if (!res.ok) {
            throw new Error('구장 데이터를 가져오는데 실패했습니다.')
          }
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

          // 기존 사진 정보 설정
          setExistingPhotos(ground.gphotosDTOList || [])
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
      .then(res => {
        if (!res.ok) {
          throw new Error('파일 업로드에 실패했습니다.')
        }
        return res.json()
      })
      .then(json => showResult(json))
      .catch(err => console.log('파일 업로드 오류:', err))
  }, [labelFile, membersMid, token])

  function showResult(arr: GphotosDTO[]) {
    const uploadUL = document.querySelector('.uploadResult ul')
    const url = 'http://localhost:8080/api/display'
    let str = ''

    arr.forEach(item => {
      const thumbnailPath = item.thumbnailURL || item.path
      if (thumbnailPath) {
        str += `<li data-name="${item.gphotosName}" data-path="${thumbnailPath}" data-uuid="${item.uuid}">
          <button class="removeBtn" type="button">X</button>
          <img src="${url}?fileName=${thumbnailPath}" alt="thumbnail" />
        </li>`
      }
    })
    if (uploadUL) {
      uploadUL.innerHTML = str

      uploadUL.querySelectorAll('.removeBtn').forEach(btn => {
        btn.addEventListener('click', e => {
          const targetLi = (e.target as HTMLElement).closest('li')
          if (targetLi) {
            const uuid = targetLi.getAttribute('data-uuid')
            if (uuid) {
              removeImage(uuid)
            }
          }
        })
      })
    }
  }

  // 특정 사진 삭제 함수
  const removeImage = (uuid: string) => {
    const deleteUrl = `http://localhost:8080/api/removeFile/${uuid}`
    fetch(deleteUrl, {
      method: 'POST',
      headers: {Authorization: `Bearer ${token}`}
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('이미지 삭제에 실패했습니다.')
        }
        return response.json()
      })
      .then(success => {
        if (success) {
          setExistingPhotos(prevPhotos => prevPhotos.filter(p => p.uuid !== uuid))
        }
      })
      .catch(err => console.log('오류 발생: ', err))
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
      gphotosDTOList: existingPhotos
    }

    fetch('http://localhost:8080/api/grounds/modify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(formDataObj)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('구장 수정에 실패했습니다.')
        }
        return res.text()
      })
      .then(() => navigate(`/grounds/read?gno=${gno}`))
      .catch(err => console.log('구장 수정 오류:', err))
  }

  return (
    <>
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
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">가격</label>
          <input type="number" name="price" ref={refPrice} className="form-control" />
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

        {/* 기존 사진 정보 미리보기 */}
        <div className="existing-photos">
          <label>기존 사진:</label>
          <ul>
            {existingPhotos.map(photo => {
              const thumbnailPath = photo.thumbnailURL || photo.path
              return thumbnailPath ? (
                <li key={photo.uuid as string}>
                  <img
                    src={`http://localhost:8080/api/display?fileName=${thumbnailPath}`}
                    alt="thumbnail"
                    style={{width: '100px', height: 'auto'}}
                  />
                  <p>{photo.gphotosName}</p>
                  <button type="button" onClick={() => removeImage(photo.uuid as string)}>
                    X
                  </button>
                </li>
              ) : null
            })}
          </ul>
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

        <div className="uploadResult">
          <ul></ul>
        </div>

        <button type="submit" className="btn btn-primary">
          변경 사항 저장
        </button>
      </form>
    </>
  )
}
