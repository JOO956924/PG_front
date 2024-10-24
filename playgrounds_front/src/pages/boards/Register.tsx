import {FormEvent, useCallback, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import useToken from '../../hooks/useToken'

interface PhotosDTO {
  uuid: string | Blob
  photosName: string | Blob
  path: string | Blob
}

export default function Register() {
  const [query] = useSearchParams()
  const token = useToken()
  const navigate = useNavigate()

  const refTitle = useRef<HTMLInputElement | null>(null)
  const refBody = useRef<HTMLTextAreaElement | null>(null)
  const refFile = useRef<HTMLInputElement | null>(null)
  const [labelFile, setLabelFile] = useState('')

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
      (flist?.length ?? 0) - 1 === 0 ? '' : `${fileName} 외 ${(flist?.length ?? 0) - 1}개`
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
  }, [token])

  function showResult(arr: []) {
    const uploadUL = document.querySelector('.uploadResult ul')
    let str = ''
    const url = 'http://localhost:8080/api/display'
    for (let i = 0; i < arr.length; i++) {
      str += `<li data-name='${arr[i].fileName}' data-path='${arr[i].folderPath}' data-uuid='${arr[i].uuid}' data-file='${arr[i].photosURL}'>
                <div>
                  <button class="removeBtn" type="button">X</button>
                  <img src="${url}?fileName=${arr[i].thumbnailURL}">
                </div>
              </li>`
    }
    uploadUL.innerHTML = str
    const removeBtns = document.querySelectorAll('.removeBtn')
    for (let i = 0; i < removeBtns.length; i++) {
      removeBtns[i].onclick = function () {
        const removeUrl = 'http://localhost:8080/api/removeFile?fileName='
        const targetLi = this.closest('li')
        const fileName = targetLi.dataset.file
        fetch(removeUrl + fileName, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(response => response.json())
          .then(json => {
            if (json === true) targetLi.remove()
            document.querySelector('#fileInput').value = ''
          })
          .catch(err => console.log('Error occurred: ', err))
      }
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let page = query.get('page') || '1'
    let type = query.get('type') || ''
    let keyword = query.get('keyword') || ''

    const formData = new FormData(e.currentTarget)
    if (refTitle.current?.value === '' || refTitle.current?.value == null) {
      refTitle.current?.focus()
      return
    }

    const liArr = document.querySelectorAll('.uploadResult ul li')
    let arr: PhotosDTO[] = []
    for (let i = 0; i < liArr.length; i++) {
      arr.push({
        photosName: liArr[i].dataset.name,
        path: liArr[i].dataset.path,
        uuid: liArr[i].dataset.uuid
      })
    }

    arr.forEach((photo, index) => {
      formData.append(`photosDTOList[${index}].uuid`, photo.uuid)
      formData.append(`photosDTOList[${index}].photosName`, photo.photosName)
      formData.append(`photosDTOList[${index}].path`, photo.path)
    })

    const formDataObj = {
      title: refTitle.current?.value ?? '',
      body: refBody.current?.value ?? '',
      photosDTOList: arr
    }

    if (token) {
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
          console.log(data)
          navigate(
            `/boards/list?page=${page}&type=${type}&keyword=${keyword}&msg=${data}`
          )
        })
        .catch(err => console.log('Error: ' + err))
    }
  }

  const handleGoBack = () => {
    if (confirm('작성중인 모든 정보가 사라집니다. 뒤로 가시겠습니까?')) {
      navigate(-1)
    }
  }

  return (
    <>
      <div style={{padding: '0 15%', overflowY: 'auto', maxHeight: '80vh'}}>
        <button
          onClick={handleGoBack}
          style={{
            fontSize: '22px',
            marginBottom: '10px',
            backgroundColor: '#007bff', // 버튼 색상 설정
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px'
          }}>
          뒤로가기
        </button>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" style={{fontSize: '22px'}}>
              Title
            </label>
            <input
              type="text"
              name="title"
              ref={refTitle}
              style={{fontSize: '22px'}}
              id="title"
              className="form-control"
              placeholder="타이틀을 입력하세요"
            />
          </div>
          <div className="form-group">
            <label htmlFor="body" style={{fontSize: '22px'}}>
              Body
            </label>
            <textarea
              name="body"
              ref={refBody}
              style={{fontSize: '22px', width: '100%', height: '150px'}}
              id="body"
              className="form-control"
              placeholder="본문 내용을 입력하세요"
            />
          </div>
          <div className="form-group">
            <button
              type="button"
              style={{
                fontSize: '22px',
                backgroundColor: '#007bff', // 버튼 색상 설정
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                marginRight: '10px' // 간격을 주기 위해 추가
              }}
              onClick={() => refFile.current?.click()}>
              Select Image Files
            </button>
            <input
              type="file"
              ref={refFile}
              style={{display: 'none'}}
              multiple
              onChange={fileChange}
              id="fileInput"
            />
            <button
              type="submit"
              style={{
                fontSize: '22px',
                backgroundColor: '#007bff', // 버튼 색상 설정
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px'
              }}>
              Submit
            </button>
          </div>
          <div className="uploadResult">
            <ul></ul>
          </div>
        </form>
      </div>
    </>
  )
}
