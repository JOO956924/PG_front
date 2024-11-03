import {FormEvent, useCallback, useEffect, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import useToken from '../../hooks/useToken'
// import './modify.css'

interface BphotosDTO {
  uuid: string | Blob
  bphotosName: string | Blob
  path: string | Blob
}

// 세션 스토리지에서 email 가져오기
const email = sessionStorage.getItem('email') || ''

export default function Modify() {
  const [query] = useSearchParams()
  const token = useToken()
  const navigate = useNavigate()

  const refTitle = useRef<HTMLInputElement | null>(null)
  const refBody = useRef<HTMLInputElement | null>(null)
  const refFile = useRef<HTMLInputElement | null>(null)

  const [labelFile, setLabelFile] = useState('')
  const [membersMid, setMembersMid] = useState<string>('')

  const bno = query.get('bno') // 게시글 번호

  // 게시글 및 기존 사진 로드
  useEffect(() => {
    const storedMid = sessionStorage.getItem('mid')
    if (storedMid) setMembersMid(storedMid)

    if (bno && token) {
      fetch(`http://localhost:8080/api/boards/read/${bno}`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${token}`}
      })
        .then(res => {
          if (!res.ok) throw new Error('구장 데이터를 가져오는데 실패했습니다.')
          return res.json()
        })
        .then(data => {
          const boards = data.boardsDTO
          refTitle.current!.value = boards.title
          refBody.current!.value = boards.body

          // 기존 사진을 썸네일로 표시
          showResult(boards.bphotosDTOList || [])
        })
        .catch(err => console.error('구장 로딩 오류:', err))
    }
  }, [bno, token])

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
    const fileName = refFile.current?.value.split('\\').pop() || ''
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
    formData.append('email', email) // email 추가

    fetch('http://localhost:8080/api/uploadAjax', {
      method: 'POST',
      body: formData,
      headers: {Authorization: `Bearer ${token}`}
    })
      .then(res => res.json())
      .then(json => showResult(json))
      .catch(err => console.log('파일 업로드 오류:', err))
  }, [labelFile, membersMid, email, token])

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
      {ref: refTitle, name: '제목'},
      {ref: refBody, name: '내용'}
    ]

    for (const field of fields) {
      if (!field.ref.current?.value) {
        alert(`${field.name}을(를) 입력하세요.`)
        field.ref.current?.focus()
        return
      }
    }

    const liArr = document.querySelectorAll('.uploadResult ul li')
    const bphotosDTOList: BphotosDTO[] = Array.from(liArr).map(li => ({
      uuid: li.dataset.uuid || '',
      bphotosName: li.dataset.name || '',
      path: li.dataset.path || ''
    }))

    const formDataObj = {
      bno,

      title: refTitle.current?.value ?? '',
      body: refBody.current?.value ?? '',
      email: email,

      members_mid: membersMid,
      bphotosDTOList
    }

    fetch('http://localhost:8080/api/boards/modify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(formDataObj)
    })
      .then(res => res.text())
      .then(data => navigate(`/boards/read?bno=${bno}`))
      .catch(err => console.log('수정 오류:', err))
  }

  const handleDelete = useCallback(() => {
    if (window.confirm('정말로 이 글을 삭제하시겠습니까?')) {
      fetch(`http://localhost:8080/api/boards/remove/${bno}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({pageRequestDTO: {}}) // PageRequestDTO를 필요 시 전달
      })
        .then(() => navigate('/boards/list'))
        .catch(err => console.error('게시글 삭제 오류:', err))
    }
  }, [bno, token, navigate])

  return (
    <div style={{padding: '0 15%', overflowY: 'auto', maxHeight: '80vh'}}>
      <form onSubmit={handleSubmit} id="frmModify">
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input type="text" name="title" ref={refTitle} className="form-control" />
        </div>

        <div className="form-group">
          <label htmlFor="body">구장 정보</label>
          <input type="text" name="body" ref={refBody} className="form-control" />
        </div>
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

        <button type="submit" className="btn btn-primary">
          변경 사항 저장
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="btn btn-danger"
          style={{marginLeft: '10px'}}>
          글 삭제
        </button>
      </form>
    </div>
  )
}
