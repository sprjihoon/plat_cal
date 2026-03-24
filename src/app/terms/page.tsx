import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>쇼핑몰 수익 관리 시스템 이용약관</CardTitle>
            <p className="text-sm text-muted-foreground">시행일: 2026년 3월 24일</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2 className="text-lg font-semibold mt-6 mb-3">제1조 (목적)</h2>
            <p className="text-muted-foreground mb-4">
              이 약관은 쇼핑몰 수익 관리 시스템(이하 &quot;서비스&quot;)의 이용과 관련하여 
              서비스 제공자와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">제2조 (정의)</h2>
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
              <li>&quot;서비스&quot;란 쇼핑몰 판매자를 위한 마진 계산, 판매 관리, 비용 분석 등의 기능을 제공하는 웹 애플리케이션을 말합니다.</li>
              <li>&quot;이용자&quot;란 이 약관에 따라 서비스를 이용하는 회원을 말합니다.</li>
              <li>&quot;회원&quot;이란 서비스에 가입하여 아이디를 부여받은 자를 말합니다.</li>
            </ol>

            <h2 className="text-lg font-semibold mt-6 mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
              <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>서비스 제공자는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.</li>
              <li>변경된 약관은 공지 후 7일이 경과한 날부터 효력이 발생합니다.</li>
            </ol>

            <h2 className="text-lg font-semibold mt-6 mb-3">제4조 (서비스의 제공)</h2>
            <p className="text-muted-foreground mb-2">서비스는 다음과 같은 기능을 제공합니다:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>마진 계산기 (순이익 계산, 판매가 정하기, 원가 찾기)</li>
              <li>상품 관리 및 마켓별 설정</li>
              <li>판매 기록 관리</li>
              <li>광고비 및 운영비 관리</li>
              <li>기간별 결산 리포트</li>
              <li>데이터 내보내기 (CSV)</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">제5조 (회원가입)</h2>
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
              <li>이용자는 서비스가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의함으로써 회원가입을 신청합니다.</li>
              <li>서비스는 소셜 로그인(카카오, 네이버) 또는 이메일 가입을 지원합니다.</li>
            </ol>

            <h2 className="text-lg font-semibold mt-6 mb-3">제6조 (회원의 의무)</h2>
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
              <li>회원은 자신의 계정 정보를 안전하게 관리해야 합니다.</li>
              <li>회원은 서비스를 불법적인 목적으로 사용해서는 안 됩니다.</li>
              <li>회원은 타인의 정보를 도용하거나 허위 정보를 입력해서는 안 됩니다.</li>
            </ol>

            <h2 className="text-lg font-semibold mt-6 mb-3">제7조 (서비스의 중단)</h2>
            <p className="text-muted-foreground mb-4">
              서비스 제공자는 시스템 점검, 보수, 교체 등의 사유로 서비스 제공을 일시적으로 중단할 수 있으며,
              이 경우 사전에 공지합니다. 다만, 긴급한 경우에는 사후에 공지할 수 있습니다.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">제8조 (면책조항)</h2>
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
              <li>서비스 제공자는 천재지변, 전쟁, 기타 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
              <li>서비스에서 제공하는 계산 결과는 참고용이며, 실제 거래에서 발생하는 손익에 대해 서비스 제공자는 책임지지 않습니다.</li>
              <li>회원이 입력한 데이터의 정확성에 대한 책임은 회원에게 있습니다.</li>
            </ol>

            <h2 className="text-lg font-semibold mt-6 mb-3">제9조 (분쟁해결)</h2>
            <p className="text-muted-foreground mb-4">
              서비스 이용과 관련하여 분쟁이 발생한 경우, 양 당사자는 원만한 해결을 위해 성실히 협의합니다.
              협의가 이루어지지 않을 경우 관할 법원에 소를 제기할 수 있습니다.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">부칙</h2>
            <p className="text-muted-foreground">
              이 약관은 2026년 3월 24일부터 시행됩니다.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
