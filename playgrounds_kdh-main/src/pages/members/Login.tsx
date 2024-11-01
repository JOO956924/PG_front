import type {ChangeEvent, FormEvent} from 'react'
import {useState, useCallback, useEffect, useRef} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {useAuth} from '../../contexts'
import * as U from '../../utils'

type LoginFormType = Record<'email' | 'pw', string>
const initialFormState = {email: '', pw: ''}

export default function Login() {
  const [{email, pw}, setForm] = useState<LoginFormType>(initialFormState)
  const changed = useCallback(
    (key: keyof LoginFormType) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm(obj => ({...obj, [key]: e.target.value}))
    },
    []
  )

  const navigate = useNavigate()
  const {login} = useAuth()

  const emailRef = useRef<HTMLInputElement>(null)
  const pwRef = useRef<HTMLInputElement>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (emailRef.current?.value === '') {
      alert('Please Check Email')
      emailRef.current.focus()
      return
    }
    if (pwRef.current?.value === '') {
      alert('Please Check Password')
      pwRef.current.focus()
      return
    }

    await getSession(email, pw)
  }

  const getSession = async (email: string, pw: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/login?email=${email}&pw=${pw}`,
        {
          method: 'POST'
        }
      )

      const data = await response.json() // JSON 응답으로 변환

      if (data.token) {
        sessionStorage.setItem('token', data.token)
        sessionStorage.setItem('email', email) // 이메일 저장
        sessionStorage.setItem('mid', data.mid) // mid 저장

        if (data.roles) {
          sessionStorage.setItem('roles', JSON.stringify(data.roles)) // 이미 숫자로 저장된 roles
        }

        console.log('Session Storage Values:')
        console.log('Token:', sessionStorage.getItem('token'))
        console.log('Email:', sessionStorage.getItem('email'))
        console.log('Mid:', sessionStorage.getItem('mid'))
        console.log('Roles:', sessionStorage.getItem('roles'))

        navigate('/grounds/list')
      } else {
        navigate('/login')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    U.readObjectP<LoginFormType>('user')
      .then(user => {
        if (user) setForm(user)
      })
      .catch(e => console.error(e))
    emailRef.current?.focus()
  }, [])

  return (
    <div>
      <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto">
        <div
          className="w-full px-6 py-8 text-black rounded shadow-md"
          style={{background: '#bd5d38'}}>
          <form method="post" onSubmit={onSubmit}>
            <h1 className="mb-8 text-4xl text-center text-white text-primary">
              Insta Feeds
            </h1>
            <input
              type="text"
              name="email"
              ref={emailRef}
              className="w-full p-3 mb-4 text-xl rounded-lg size-22"
              placeholder="Email"
              value={email} // 상태에 따라 이메일 입력란 값 설정
              onChange={changed('email')}
            />
            <input
              type="password"
              name="pw"
              ref={pwRef}
              className="w-full p-3 mb-4 text-xl rounded-lg size-22"
              placeholder="Password"
              value={pw}
              onChange={changed('pw')}
            />
            <button
              type="submit"
              className="w-full p-3 mb-4 text-2xl text-black bg-yellow-400 rounded-lg size-16">
              Login
            </button>
          </form>
        </div>
        <div className="mt-6 text-lg text-grey-dark">
          Create account?
          <Link className="ml-5 text-lg" to="/join">
            Join
          </Link>
        </div>
      </div>
    </div>
  )
}
