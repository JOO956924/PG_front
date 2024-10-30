import {FormEvent, useEffect, useRef, useState} from 'react'
import useToken from '../../hooks/useToken'
import {useNavigate, useSearchParams, useLocation} from 'react-router-dom'
import './BoardStyles.css'

// Boards 데이터 구조 정의
interface Boards {
  bno: number
  title: string
  bphotosDTOList: {path: string}[]
  reviewsCnt: number
  likes: number
  regDate: string
}

// PageRequestDTO 구조 정의
interface PageRequestDTO {
  page: string
  size: string
  type: string
  keyword: string
}

// PageResultDTO 구조 정의
interface PageResultDTO {
  dtoList: Boards[]
  page: number
  start: number
  end: number
  pageList: number[]
  prev: boolean
  next: boolean
}

export default function List() {
  const token = useToken()
  const navigate = useNavigate()
  const location = useLocation()
  // 주소의 쿼리를 받기 위한 선언
  const [query] = useSearchParams()

  // 입력양식태그 접근을 위한 선언
  const refType = useRef<HTMLSelectElement | null>(null)
  const refKeyword = useRef<HTMLInputElement | null>(null)
  const refBtnSrch = useRef<HTMLButtonElement | null>(null)

  // 가변 상태를 캐시하기 위한 선언
  const [pageRequestDTO, setPageRequestDTO] = useState<PageRequestDTO>({
    page: '',
    size: '',
    type: '',
    keyword: ''
  })
  const [pageResultDTO, setPageResultDTO] = useState<PageResultDTO | null>(null)

  const [inverted, setInverted] = useState(true)
  const [keywords, setKeywords] = useState('')
  const [types, setTypes] = useState('')

  const options = [
    {value: '', label: '선택하세요'},
    {value: 't', label: '제목'},
    {value: 'c', label: '내용'},
    {value: 'w', label: '작성자'},
    {value: 'tc', label: '제목 + 내용'},
    {value: 'tcw', label: '제목 + 내용 + 작성자'}
  ]

  useEffect(() => {
    let compare = query.get('page')
    const page = compare === 'null' || compare == null ? '1' : compare
    compare = query.get('type')
    const type = compare === 'null' || compare == null ? '' : compare
    compare = query.get('keyword')
    const keyword = compare === 'null' || compare == null ? '' : compare

    let url = 'http://localhost:8080/api/boards/list'
    const queryParams = []

    if (type) {
      setTypes(type)
      setInverted(false)
      queryParams.push(`type=${type}`)
    }
    if (page) queryParams.push(`page=${page}`)
    if (keyword) {
      setInverted(false)
      queryParams.push(`keyword=${keyword}`)
    }
    if (queryParams.length > 0) url += '?' + queryParams.join('&')

    if (token) {
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
          console.log('페이지 API:', data.pageResultDTO)
        })
        .catch(err => console.log('Error:', err))
    }
  }, [query, types, token]) // 쿼리 파라미터 변경 시 리스트 다시 불러옴

  const url = `/boards`

  const getSearch = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault()

    const keywordw = refKeyword.current?.value
    const typew = refType.current?.value

    if (!keywordw) {
      refKeyword.current?.focus()
      return
    }

    navigate(url + `/list?type=${typew}&keyword=${keywordw}&page=1`)
  }

  const goRead = (bno: number, page: number, type: string, keyword: string) => {
    navigate(`${url}/read?bno=${bno}&page=${page}&type=${type}&keyword=${keyword}`)
  }

  const goRegister = (): void => {
    const {page, type, keyword} = pageRequestDTO
    navigate(`/boards/register?page=${page}&type=${type}&keyword=${keyword}`)
  }

  return (
    <div className="list-container">
      <form method="GET" className="search-form">
        <div className="input-group">
          <div className="input-group-prepend">
            <select
              className="form-control"
              ref={refType}
              name="type"
              value={types}
              onChange={e => {
                setTypes(e.target.value)
                if (e.target.value === '') {
                  setKeywords('')
                  setInverted(true)
                  navigate(`/`)
                } else {
                  setInverted(false)
                  refKeyword.current?.focus()
                }
              }}>
              {options.map((item, idx) => (
                <option key={idx} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            className="form-control"
            name="keyword"
            ref={refKeyword}
            disabled={inverted}
            onChange={e => setKeywords(e.target.value)}
            value={pageRequestDTO.keyword ?? keywords}
          />
          <div className="input-group-append">
            <button
              type="button"
              className="btn btn-primary"
              onClick={getSearch}
              disabled={inverted}>
              검색
            </button>
            <button type="button" className="btn btn-secondary" onClick={goRegister}>
              등록
            </button>
          </div>
        </div>
      </form>
      <table className="table table-striped">
        <thead>
          <tr>
            <th scope="col">Bno</th>
            <th scope="col">Bphoto & Title</th>
            <th scope="col">Review Count</th>
            <th scope="col">Average Rating</th>
            <th scope="col">RegDate</th>
          </tr>
        </thead>
        <tbody>
          {pageResultDTO?.dtoList.map(boardsDTO => (
            <tr
              key={boardsDTO.bno}
              className="boardslist"
              onClick={() =>
                goRead(
                  boardsDTO.bno,
                  pageResultDTO.page,
                  pageRequestDTO.type,
                  pageRequestDTO.keyword
                )
              }>
              <th scope="row">{boardsDTO.bno}</th>
              <td>
                {boardsDTO.bphotosDTOList.length > 0 &&
                boardsDTO.bphotosDTOList[0].path != null ? (
                  <img
                    src={`http://localhost:8080/api/display?fileName=${boardsDTO.bphotosDTOList[0].thumbnailURL}`}
                    className="thumbnail"
                    alt="Boards Thumbnail"
                  />
                ) : (
                  ''
                )}
                {boardsDTO.title}
              </td>
              <td>
                <b>{boardsDTO.reviewsCnt}</b>
              </td>
              <td>
                <b>{boardsDTO.likes}</b>
              </td>
              <td>
                {new Intl.DateTimeFormat('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false // 24시간 형식 사용
                }).format(new Date(boardsDTO.regDate))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pageResultDTO && (
        <div className="pagination">
          {pageResultDTO.page > 1 && pageResultDTO.prev && (
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                navigate(
                  `${url}/list?page=${pageResultDTO.page - 1}&type=${
                    pageRequestDTO.type
                  }&keyword=${pageRequestDTO.keyword}`
                )
              }}>
              &lt; 이전
            </button>
          )}
          <span>
            {pageResultDTO.page} / {Math.ceil(pageResultDTO.end / pageResultDTO.size)}
          </span>
          {pageResultDTO.page < Math.ceil(pageResultDTO.end / pageResultDTO.size) &&
            pageResultDTO.next && (
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  navigate(
                    `${url}/list?page=${pageResultDTO.page + 1}&type=${
                      pageRequestDTO.type
                    }&keyword=${pageRequestDTO.keyword}`
                  )
                }}>
                다음 &gt;
              </button>
            )}
        </div>
      )}
    </div>
  )
}
