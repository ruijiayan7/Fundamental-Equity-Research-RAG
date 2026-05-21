import iconEdit from '@/assets/layout/edit.svg'
import { userState } from '@/store/user'
import { Avatar } from 'antd'
import { useSnapshot } from 'valtio'
import './footer.scss'

export function Footer() {
  const user = useSnapshot(userState)

  return (
    <div className="base-layout-footer">
      <div className="base-layout-footer__main">
        <div className="header">
          <Avatar className="avatar" size="large">
            {user.username?.slice(0, 1).toUpperCase()}
          </Avatar>

          <img className="edit" src={iconEdit} />
        </div>

        <div className="body">
          <div className="username">{user.username}</div>
        </div>
      </div>
    </div>
  )
}
