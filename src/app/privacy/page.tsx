import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>개인정보처리방침</CardTitle>
            <p className="text-sm text-muted-foreground">시행일: 2026년 3월 24일</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground mb-4">
              쇼핑몰 수익 관리 시스템(이하 &quot;서비스&quot;)은 이용자의 개인정보를 중요시하며, 
              「개인정보 보호법」을 준수하고 있습니다. 서비스는 개인정보처리방침을 통하여 
              이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 
              개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">1. 수집하는 개인정보 항목</h2>
            <p className="text-muted-foreground mb-2">서비스는 회원가입, 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li><strong>필수항목:</strong> 이메일 주소, 이름(닉네임)</li>
              <li><strong>소셜 로그인 시:</strong> 소셜 서비스에서 제공하는 프로필 정보 (이메일, 이름, 프로필 이미지)</li>
              <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, 접속 IP 정보</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">2. 개인정보의 수집 및 이용목적</h2>
            <p className="text-muted-foreground mb-2">수집한 개인정보는 다음의 목적을 위해 활용됩니다:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li><strong>서비스 제공:</strong> 마진 계산, 판매 관리, 비용 분석 등 핵심 기능 제공</li>
              <li><strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원 부정이용 방지</li>
              <li><strong>서비스 개선:</strong> 신규 서비스 개발, 서비스 품질 향상</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">3. 개인정보의 보유 및 이용기간</h2>
            <p className="text-muted-foreground mb-4">
              이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다.
              단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 서비스는 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              <li>웹사이트 방문기록: 3개월 (통신비밀보호법)</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">4. 개인정보의 파기절차 및 방법</h2>
            <p className="text-muted-foreground mb-4">
              이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다.
              파기절차 및 방법은 다음과 같습니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li><strong>파기절차:</strong> 이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</li>
              <li><strong>파기방법:</strong> 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">5. 개인정보의 제3자 제공</h2>
            <p className="text-muted-foreground mb-4">
              서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 
              다만, 아래의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">6. 개인정보의 안전성 확보조치</h2>
            <p className="text-muted-foreground mb-2">서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>개인정보에 대한 접근 제한</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">7. 이용자의 권리와 그 행사방법</h2>
            <p className="text-muted-foreground mb-2">이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              위 권리 행사는 서비스 내 설정 페이지를 통해 직접 하거나, 
              서면, 전화, 이메일 등을 통해 요청하실 수 있습니다.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">8. 쿠키의 사용</h2>
            <p className="text-muted-foreground mb-4">
              서비스는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 
              수시로 불러오는 &apos;쿠키(cookie)&apos;를 사용합니다. 이용자는 웹브라우저의 옵션을 
              설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 
              모든 쿠키의 저장을 거부할 수 있습니다.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">9. 개인정보 보호책임자</h2>
            <p className="text-muted-foreground mb-4">
              서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 
              개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 
              아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-muted-foreground mb-4">
              <p><strong>개인정보 보호책임자:</strong> 장지훈</p>
              <p>이메일: info@tillion.kr</p>
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-3">10. 개인정보처리방침 변경</h2>
            <p className="text-muted-foreground mb-4">
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 
              삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">부칙</h2>
            <p className="text-muted-foreground">
              이 개인정보처리방침은 2026년 3월 24일부터 시행됩니다.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
