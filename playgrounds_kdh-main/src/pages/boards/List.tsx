import {FormEvent, useEffect, useRef, useState} from 'react'
import useToken from '../../hooks/useToken'
import {useNavigate, useSearchParams, useLocation} from 'react-router-dom'
import './BoardStyles.css'

interface Boards {
  bno: number
  title: string
  bphotosDTOList: {path: string; thumbnailURL?: string}[]
  reviewsCnt: number
  likes: number
  regDate: string
}

interface PageRequestDTO {
  page: string
  size: string
  type: string
  keyword: string
}

interface PageResultDTO {
  dtoList: Boards[]
  page: number
  start: number
  end: number
  pageList: number[]
  prev: boolean
  next: boolean
  totalPage: number // totalPage 추가
}

export default function List() {
  const token = useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [query] = useSearchParams()

  const refType = useRef<HTMLSelectElement | null>(null)
  const refKeyword = useRef<HTMLInputElement | null>(null)
  const [pageRequestDTO, setPageRequestDTO] = useState<PageRequestDTO>({
    page: '1',
    size: '10',
    type: '',
    keyword: ''
  })
  const [pageResultDTO, setPageResultDTO] = useState<PageResultDTO | null>(null)
  const [inverted, setInverted] = useState(true)
  const [types, setTypes] = useState('')

  useEffect(() => {
    const page = query.get('page') || '1'
    const type = query.get('type') || ''
    const keyword = query.get('keyword') || ''

    let url = 'http://localhost:8080/api/boards/list'
    const queryParams = []

    if (type) {
      setTypes(type)
      setInverted(false)
      queryParams.push(`type=${type}`)
    }
    if (keyword) {
      setInverted(false)
      queryParams.push(`keyword=${keyword}`)
    }

    queryParams.push(`page=${page}`)
    queryParams.push(`size=10`)

    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&')
    }

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
  }, [query, token])

  const url = `/boards`

  const getSearch = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const keywordw = refKeyword.current?.value
    const typew = refType.current?.value

    if (!keywordw) {
      refKeyword.current?.focus()
      return
    }

    navigate(`${url}/list?type=${typew}&keyword=${keywordw}&page=1`)
  }

  const goRead = (bno: number) => {
    navigate(
      `${url}/read?bno=${bno}&page=${pageResultDTO?.page}&type=${pageRequestDTO.type}&keyword=${pageRequestDTO.keyword}`
    )
  }

  const goRegister = () => {
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
              value={types}
              onChange={e => {
                const selectedValue = e.target.value
                setTypes(selectedValue)
                setInverted(selectedValue === '')
                refKeyword.current?.focus()
              }}>
              <option value="">선택하세요</option>
              <option value="t">제목</option>
              <option value="c">내용</option>
              <option value="w">작성자</option>
              <option value="tc">제목 + 내용</option>
              <option value="tcw">제목 + 내용 + 작성자</option>
            </select>
          </div>
          <input
            type="text"
            className="form-control"
            ref={refKeyword}
            disabled={inverted}
            onChange={e =>
              setPageRequestDTO({...pageRequestDTO, keyword: e.target.value || ''})
            }
            value={pageRequestDTO.keyword || ''}
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
              onClick={() => goRead(boardsDTO.bno)}>
              <th scope="row">{boardsDTO.bno}</th>
              <td>
                {boardsDTO.bphotosDTOList.length > 0 &&
                boardsDTO.bphotosDTOList[0].path ? (
                  <img
                    src={`http://localhost:8080/api/display?fileName=${boardsDTO.bphotosDTOList[0].thumbnailURL}`}
                    className="thumbnail"
                    alt="Boards Thumbnail"
                  />
                ) : null}
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
                  second: '2-digit'
                }).format(new Date(boardsDTO.regDate))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pageResultDTO && (
        <div className="pagination">
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              navigate(
                `${url}/list?page=${pageResultDTO.page - 1}&type=${
                  pageRequestDTO.type
                }&keyword=${pageRequestDTO.keyword}`
              )
            }}
            disabled={!pageResultDTO.prev}>
            &lt; 이전
          </button>

          {/* 페이지 번호 표시 */}
          {Array.from({length: pageResultDTO.totalPage}, (_, index) => index + 1)
            .filter(pageNum => {
              // 현재 페이지를 중심으로 앞뒤 2페이지를 보여주고
              // 그 외의 페이지는 생략하고 '...'을 표시하도록 필터링합니다.
              return (
                (pageNum <= pageResultDTO.page + 2 &&
                  pageNum >= pageResultDTO.page - 2) ||
                pageNum === 1 ||
                pageNum === pageResultDTO.totalPage
              )
            })
            .map(pageNum => (
              <button
                key={pageNum}
                className={`btn ${
                  pageResultDTO.page === pageNum ? 'btn-primary' : 'btn-outline-primary'
                }`}
                onClick={() => {
                  navigate(
                    `${url}/list?page=${pageNum}&type=${pageRequestDTO.type}&keyword=${pageRequestDTO.keyword}`
                  )
                }}>
                {pageNum}
              </button>
            ))}

          <button
            className="btn btn-outline-primary"
            onClick={() => {
              navigate(
                `${url}/list?page=${pageResultDTO.page + 1}&type=${
                  pageRequestDTO.type
                }&keyword=${pageRequestDTO.keyword}`
              )
            }}
            disabled={!pageResultDTO.next}>
            다음 &gt;
          </button>
        </div>
      )}
    </div>
  )
}
