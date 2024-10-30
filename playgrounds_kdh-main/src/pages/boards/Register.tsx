import {FormEvent, useCallback, useRef, useState, useEffect} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import useToken from '../../hooks/useToken'
import './BoardStyles.css'

interface BphotosDTO {
  uuid: string | Blob
  bphotosName: string | Blob
  path: string | Blob
}

export default function Register() {
  const [query] = useSearchParams()
  const token = useToken()
  const navigate = useNavigate()

  const refTitle = useRef<HTMLInputElement | null>(null)
  const refBody = useRef<HTMLTextAreaElement | null>(null)
  const refFile = useRef<HTMLInputElement | null>(null)
  const refLabelFile = useRef<HTMLLabelElement | null>(null)
  const [labelFile, setLabelFile] = useState<string>('')
  const [inputHiddens, setInputHiddens] = useState('')

  // 세션 스토리지에서 email 가져오기
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
        if (refFile?.current?.value !== undefined) refFile.current.value = ''
        appended = false
        break
      }
      formData.append('uploadFiles', flist[i])
      appended = true
    }
    if (!appended) return

    formData.append('email', email) // email 추가

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
        showResult(json)
      })
      .catch(err => console.log('Error: ', err))
  }, [labelFile, email, token])

  function showResult(arr: []) {
    const uploadUL = document.querySelector('.uploadResult ul')
    if (!uploadUL) {
      console.error('Upload result element not found.')
      return
    }

    let str = ''
    const url = 'http://localhost:8080/api/display'
    for (let i = 0; i < arr.length; i++) {
      const fileName = arr[i].fileName || ''
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

        const fileName = targetLi.dataset.file || ''
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

  const transform = (str: string) => {
    return str.replace(/\n/g, '')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const page = query.get('page') || '1'
    const type = query.get('type') || ''
    const keyword = query.get('keyword') || ''

    const formData = new FormData(e.currentTarget)

    let str = ''
    const liArr = document.querySelectorAll('.uploadResult ul li')
    let arr: BphotosDTO[] = []

    for (let i = 0; i < liArr.length; i++) {
      str += `
        <input type="hidden" name="bphotosDTOList[${i}].bphotosName" value="${liArr[i].dataset.name}" />
        <input type="hidden" name="bphotosDTOList[${i}].path" value="${liArr[i].dataset.path}" />
        <input type="hidden" name="bphotosDTOList[${i}].uuid" value="${liArr[i].dataset.uuid}" />
      `
      arr.push({
        bphotosName: liArr[i].dataset.name,
        path: liArr[i].dataset.path,
        uuid: liArr[i].dataset.uuid
      })
    }
    setInputHiddens(str)

    arr.forEach((photo, index) => {
      formData.append(`phtosDTOList[${index}].uuid`, photo.uuid)
      formData.append(`phtosDTOList[${index}].bphotosName`, photo.bphotosName)
      formData.append(`phtosDTOList[${index}].path`, photo.path)
    })

    const formDataObj = {
      title: refTitle.current?.value ?? '',
      body: refBody.current?.value ?? '',
      email: email,
      bphotosDTOList: arr
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
            value={email}
            className="form-control"
            id="email"
            placeholder="이메일을 입력하세요"
            readOnly
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
            required
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
            required
          />
        </div>
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
        <div className="form-group">
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
