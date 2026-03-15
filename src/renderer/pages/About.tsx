import React, { useState, useEffect } from 'react'
import qrCodes from '../assets/qr-codes.json'
import './About.css'

interface AppInfo {
  version: string
  name: string
  company: string
  website: string
}

export const About: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo>({
    version: '',
    name: '',
    company: '',
    website: '',
  })

  useEffect(() => {
    window.electronAPI.app.getInfo().then(setAppInfo)
  }, [])

  return (
    <div className="about-page">
      <div className="about-content">
        <div className="app-logo">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#1890ff" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <h1 className="app-name">{appInfo.name}</h1>
        <p className="app-version">版本 {appInfo.version}</p>

        <div className="company-section">
          <h2 className="company-name">{appInfo.company}</h2>
          <a
            href={`https://${appInfo.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="company-website"
          >
            {appInfo.website}
          </a>
        </div>

        {/* 公司介绍 */}
        <div className="company-intro">
          <h3>关于合果科技</h3>
          <div className="intro-content">
            <p className="intro-highlight">
              在工业制造向高端化、智能化迈进的时代，金属部件的表面性能直接决定了装备的整体寿命与可靠性。合果科技应势而生，我们不仅仅是一家加工厂，更是一家以技术为驱动，围绕金属表面完整性与功能性的科技型服务商。
            </p>

            <h4>我们的核心能力</h4>
            <p>
              合果科技拥有覆盖冷、热、光、机四大维度的全方位表面工程技术矩阵：
            </p>
            <ul className="tech-list">
              <li><strong>激光再造技术：</strong>激光熔覆（再制造与强化）、激光淬火、激光喷丸</li>
              <li><strong>热喷涂技术：</strong>超音速等离子喷涂、HVOF（超音速火焰喷涂）、HVAF（超音速空气燃料喷涂）</li>
              <li><strong>物理强化与涂层：</strong>喷丸强化、精控抛丸、干膜润滑涂层、PTFE（聚四氟乙烯）功能性涂层</li>
              <li><strong>检测与验证：</strong>荧光无损检测、磁粉探伤、X射线残余应力测试、除锈及表面预处理</li>
            </ul>

            <h4>我们的业务模式</h4>
            <p>
              合果科技通过"四位一体"的业务架构，为客户提供闭环式服务：
            </p>
            <ol className="business-list">
              <li><strong>受托加工服务：</strong>依托先进的设备与工艺，承接各类高精度零部件的表面处理外协订单。</li>
              <li><strong>设备集成与定制：</strong>根据客户工艺需求，提供激光加工设备、喷涂设备、喷抛丸设备的定制与集成服务。</li>
              <li><strong>耗材与检测设备销售：</strong>供应工艺配套的高品质金属粉末、喷涂涂料、ERVIN钢丸、EI阿尔门试片试块及阿尔门量规、电磁流量阀、拍击式筛分仪筛网等。</li>
              <li><strong>技术咨询与工艺开发：</strong>针对金属表面强化、表面失效分析等难题，提供专业的工艺解决方案及技术培训。</li>
            </ol>

            <h4>我们的愿景</h4>
            <p className="vision">
              合果科技，取义"合众智，造硕果"。我们希望通过整合多样的表面工艺技术，助力中国制造解决关键部件的"表面"难题，成为您最值得信赖的金属表面技术合作伙伴。
            </p>
          </div>
        </div>

        {/* 二维码 */}
        <div className="qr-section">
          <h3>关注我们</h3>
          <div className="qr-codes">
            <div className="qr-item">
              <div className="qr-placeholder">
                <img 
                  src={qrCodes['qr01.png']}
                  alt="微信公众号" 
                  className="qr-image" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <span>微信公众号</span>
            </div>
            <div className="qr-item">
              <div className="qr-placeholder">
                <img 
                  src={qrCodes['qr00.png']}
                  alt="企业微信" 
                  className="qr-image"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <span>企业微信</span>
            </div>
          </div>
          <p className="qr-hint">扫描二维码关注官方账号，获取更多资讯</p>
        </div>

        <div className="copyright">
          <p>© 2024 {appInfo.company} 版权所有</p>
          <p>本软件仅供学习和个人使用</p>
        </div>
      </div>
    </div>
  )
}
