import {FormEvent, useCallback, useRef, useState, useEffect} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import useToken from '../../hooks/useToken'
import './BoardStyles.css'

interface PhotosDTO {
  uuid: string
  photosName: string
  path: string
}

export default function Register() {
  const [query] = useSearchParams()
  const token = useToken()
  const navigate = useNavigate()

  const refTitle = useRef<HTMLInputElement | null>(null)
  const refBody = useRef<HTMLTextAreaElement | null>(null)
  const refFile = useRef<HTMLInputElement | null>(null)
  const [labelFile, setLabelFile] = useState<string>('')
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotosDTO[]>([])

  // 세션 스토리지에서 이메일 가져오기
  const email = sessionStorage.getItem('email') || ''

  const checkExtension = useCallback((fileName: string, fileSize: number) => {
    const maxSize = 1024 * 1024 * 10 // 10MB
    if (fileSize >= maxSize) {
      alert('파일 사이즈 초과')
      return false
    }
    const regex = new RegExp('(.*?).(jpg|jpeg|png|gif|bmp|pdf)$', 'i')
    if (!regex.test(fileName)) {
      alert('해당 파일 업로드 금지!')
      return false
    }
    return true
  }, [])

  const fileChange = useCallback(() => {
    const formData = new FormData()
    const fileName = refFile.current?.value.split('\\').pop()
    const flist = refFile.current?.files ?? []
    const flistLength = flist.length

    const tmpLabel = flistLength === 0 ? '' : `${fileName} 외 ${flistLength - 1}개`
    setLabelFile(tmpLabel)

    let appended = false
    for (let i = 0; i < flistLength; i++) {
      if (!checkExtension(flist[i].name, flist[i].size)) {
        refFile.current!.value = ''
        appended = false
        break
      }
      formData.append('uploadFiles', flist[i])
      appended = true
    }
    if (!appended) return

    fetch('http://localhost:8080/api/uploadAjax', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(showResult)
      .catch(err => console.log('Error: ', err))
  }, [token])

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
    const page = query.get('page') || '1'
    const type = query.get('type') || ''
    const keyword = query.get('keyword') || ''

    const formDataObj = {
      title: refTitle.current?.value ?? '',
      body: refBody.current?.value ?? '',
      email: email, // 세션 스토리지에서 가져온 이메일 사용
      photosDTOList: uploadedPhotos
    }

    if (!refTitle.current?.value) {
      refTitle.current?.focus()
      return
    }

    fetch('http://localhost:8080/api/boards/register', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(formDataObj)
    })
      .then(res => res.text())
      .then(data => {
        navigate(`/boards/list?page=${page}&type=${type}&keyword=${keyword}&msg=${data}`)
      })
      .catch(err => console.log('Error: ' + err))
  }

  const handleGoBack = () => {
    if (confirm('작성중인 모든 정보가 사라집니다. 뒤로 가시겠습니까?')) {
      navigate(-1)
    }
  }

  return (
    <div className="register-container">
      <button className="btn btn-secondary" onClick={handleGoBack}>
        뒤로가기
      </button>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={email} // 세션 스토리지에서 가져온 이메일 고정
            className="form-control"
            id="email"
            placeholder="이메일을 입력하세요"
            readOnly // 수정 불가로 설정
          />
        </div>
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title
          </label>
          <input
            type="text"
            name="title"
            ref={refTitle}
            className="form-control"
            id="title"
            placeholder="타이틀을 입력하세요"
            required // 필수 입력으로 설정
          />
        </div>
        <div className="form-group">
          <label htmlFor="body" className="form-label">
            Body
          </label>
          <textarea
            name="body"
            ref={refBody}
            className="form-control content-textarea"
            id="body"
            placeholder="본문 내용을 입력하세요"
            required // 필수 입력으로 설정
          />
        </div>
        <div className="form-group">
          <button
            type="button"
            className="file-select-button btn btn-primary"
            onClick={() => refFile.current?.click()}>
            사진 추가
          </button>
          <input
            type="file"
            ref={refFile}
            className="file-input"
            multiple
            onChange={fileChange}
            id="fileInput"
            style={{display: 'none'}} // 숨김 처리
          />
          <button type="submit" className="btn btn-success">
            게시글 등록
          </button>
        </div>
        <div className="uploadResult">
          <ul></ul>
        </div>
      </form>
    </div>
  )
}
