export type StaticSeoPage = {
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  keywords: string;
  category: 'menu' | 'dish' | 'local' | 'trust';
  heroLabel: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string[];
    bullets?: string[];
  }>;
  faqs?: Array<{ question: string; answer: string }>;
  related: Array<{ label: string; href: string }>;
};

export const restaurantInfo = {
  name: 'Cơm Thị Nở',
  phone: '0971.170.103',
  tel: '0971170103',
  address: 'A16TT18 Nguyễn Khuyến, KĐT Văn Quán, Hà Đông, Hà Nội',
  hours: '09:00 - 22:00 hằng ngày',
  mapUrl: 'https://share.google/hEGDxD42rKNQeEOfh',
};

const commonRelated = [
  { label: 'Thực đơn Cơm Thị Nở', href: '/thuc-don' },
  { label: 'Cơm ngon Hà Đông', href: '/com-ngon-ha-dong' },
  { label: 'Cơm ngon Văn Quán', href: '/com-ngon-van-quan' },
  { label: 'Đặt cơm văn phòng Hà Đông', href: '/com-van-phong-ha-dong' },
];

const localSeoRelated = [
  { label: 'Cơm Văn Quán', href: '/com-van-quan' },
  { label: 'Cơm văn phòng Hà Đông', href: '/com-van-phong-ha-dong' },
  { label: 'Cơm trưa văn phòng Hà Đông', href: '/com-trua-van-phong-ha-dong' },
  { label: 'Cơm gia đình Hà Đông', href: '/com-gia-dinh-ha-dong' },
  { label: 'Cơm quê Hà Đông', href: '/com-que-ha-dong' },
  { label: 'Quán cơm ngon Hà Đông', href: '/quan-com-ngon-ha-dong' },
  { label: 'Cơm mang về Hà Đông', href: '/com-mang-ve-ha-dong' },
  ...commonRelated,
];

function buildLocalLandingPage(input: {
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  keywords: string;
  heroLabel: string;
  primaryKeyword: string;
  intent: string;
  service: string;
}): StaticSeoPage {
  return {
    path: input.path,
    title: input.title,
    seoTitle: input.seoTitle,
    description: input.description,
    keywords: input.keywords,
    category: 'local',
    heroLabel: input.heroLabel,
    intro: `${input.primaryKeyword} tại Cơm Thị Nở dành cho khách ở Văn Quán, Hà Đông muốn có một bữa cơm Bắc Bộ nóng, sạch, dễ ăn và đặt được theo nhu cầu ${input.intent}.`,
    sections: [
      {
        heading: `${input.primaryKeyword} tại Văn Quán, Hà Đông`,
        body: [
          `Cơm Thị Nở nằm tại ${restaurantInfo.address}, thuận tiện cho khách quanh Nguyễn Khuyến, KĐT Văn Quán, Phúc La, Mỗ Lao, Trần Phú và Chiến Thắng. Khi khách tìm ${input.primaryKeyword}, điều quan trọng không chỉ là một suất cơm no bụng, mà còn là món ăn hợp khẩu vị, lên nóng, dễ chia sẻ và có thể đặt trước đúng giờ.`,
          `Quán chọn phong vị cơm Bắc Bộ làm nền: cơm nóng, món kho đậm vị, món rang/xào vừa miệng, canh thanh và rau theo mùa. Nhờ cách phối món này, bữa ăn phù hợp cả khách văn phòng, khách gia đình, nhóm bạn và khách cần cơm mang về tại Hà Đông.`,
        ],
      },
      {
        heading: `Vì sao chọn Cơm Thị Nở cho ${input.service}?`,
        body: [
          `Thực đơn được xây quanh những món quen thuộc như cá kho riềng, thịt rang cháy cạnh, sườn xào chua ngọt, gà rang, canh cua cà pháo, rau xào theo mùa và các món ăn kèm dân dã. Mỗi nhóm khách có thể gọi theo suất, theo mâm hoặc theo ngân sách để bữa cơm gọn mà vẫn đủ món.`,
          `Với khách đi nhóm, quán tư vấn mâm cơm cân bằng giữa món mặn, canh, rau và món kèm. Với khách văn phòng, quán ưu tiên thời gian chuẩn bị và đóng gói. Với khách gia đình, món được chọn theo khẩu vị chung, dễ ăn cho cả người lớn và trẻ nhỏ.`,
        ],
        bullets: [
          'Vị cơm nhà Bắc Bộ, dễ ăn trong bữa trưa và bữa tối.',
          'Nhận đặt trước theo số người, khung giờ và ngân sách.',
          'Phù hợp ăn tại quán, mang về, cơm văn phòng và mâm gia đình.',
          'Khu vực phục vụ tập trung quanh Văn Quán, Hà Đông.',
        ],
      },
      {
        heading: 'Món ăn nổi bật nên thử',
        body: [
          `Nếu lần đầu ghé quán, khách có thể bắt đầu bằng cá kho riềng ăn cùng cơm nóng, thêm canh cua cà pháo để cân bằng vị. Nhóm thích món đậm đà có thể chọn thịt rang cháy cạnh, sườn xào chua ngọt, gà rang gừng hoặc rau xào theo mùa.`,
          `Với đơn văn phòng hoặc cơm đoàn, quán có thể gợi ý thực đơn xoay vòng để tránh lặp món. Các món kèm như trứng, rau, dưa muối, cơm thêm hoặc món nhỏ được chuẩn bị để khách dễ điều chỉnh theo số lượng người ăn.`,
        ],
      },
      {
        heading: 'Không gian quán và trải nghiệm dùng bữa',
        body: [
          `Không gian Cơm Thị Nở hướng đến sự ấm cúng, gần với một bữa cơm gia đình hơn là bữa ăn vội. Khách có thể dùng bữa tại quán, gọi món theo mâm, hoặc đặt trước để quán chuẩn bị bàn cho nhóm đông người.`,
          `Với khách cần ${input.service}, việc gọi trước giúp quán xác nhận món trong ngày, thời gian nhận và cách đóng gói phù hợp. Đây là cách tốt nhất để bữa cơm đến tay khách vẫn nóng, rõ món và đúng nhu cầu.`,
        ],
      },
      {
        heading: 'Khu vực phục vụ tại Hà Đông',
        body: [
          `Cơm Thị Nở tập trung phục vụ Văn Quán, Nguyễn Khuyến, Phúc La, Mỗ Lao, Trần Phú, Chiến Thắng và các khu dân cư, văn phòng lân cận. Toàn bộ thông tin tên quán, địa chỉ, số điện thoại và bản đồ được giữ thống nhất để khách dễ tìm và đặt cơm.`,
          `Khách có thể gọi ${restaurantInfo.phone} để hỏi thực đơn trong ngày, đặt bàn, đặt cơm văn phòng, đặt cơm mang về hoặc tư vấn mâm cơm gia đình tại Hà Đông.`,
        ],
      },
    ],
    faqs: [
      { question: `${input.primaryKeyword} có nhận đặt trước không?`, answer: 'Có. Khách nên gọi trước để quán xác nhận món trong ngày, số lượng, khung giờ nhận và cách chuẩn bị phù hợp.' },
      { question: 'Cơm Thị Nở ở khu vực nào?', answer: `Quán ở ${restaurantInfo.address}.` },
      { question: 'Có cơm mang về hoặc giao quanh Hà Đông không?', answer: 'Có. Quán nhận cơm mang về và hỗ trợ đơn gần khu Văn Quán, Hà Đông theo tình hình phục vụ trong ngày.' },
      { question: 'Có phù hợp đặt cơm văn phòng không?', answer: 'Có. Quán nhận đặt theo suất, theo mâm hoặc theo nhóm công ty, ưu tiên thực đơn dễ ăn và đúng giờ.' },
      { question: 'Có nhận tiệc gia đình hoặc cơm đoàn không?', answer: 'Có. Khách báo số người, ngân sách và khẩu vị để quán tư vấn mâm cơm phù hợp.' },
      { question: 'Món nào được khách gọi nhiều?', answer: 'Các món phổ biến gồm cá kho riềng, thịt rang cháy cạnh, sườn xào chua ngọt, canh cua cà pháo, rau theo mùa và cơm niêu.' },
      { question: 'Có xuất VAT cho đơn công ty không?', answer: 'Quán hỗ trợ thông tin hóa đơn theo yêu cầu. Khách nên báo trước khi đặt đơn công ty.' },
      { question: 'Giờ phục vụ của quán là khi nào?', answer: `Giờ phục vụ tham khảo: ${restaurantInfo.hours}. Khách nên gọi trước vào giờ cao điểm.` },
      { question: 'Có chỗ cho nhóm gia đình không?', answer: 'Có. Khách đi nhóm nên đặt trước để quán chuẩn bị bàn và món nhanh hơn.' },
      { question: 'Làm sao xem đường đi?', answer: 'Khách có thể mở Google Maps từ website hoặc gọi hotline để được hướng dẫn đường tới quán.' },
    ],
    related: localSeoRelated.filter((item) => item.href !== input.path).slice(0, 8),
  };
}

export const staticSeoPages: StaticSeoPage[] = [
  {
    path: '/com-ngon-ha-dong',
    title: 'Cơm ngon Hà Đông',
    seoTitle: 'Cơm ngon Hà Đông | Cơm quê Bắc Bộ tại Cơm Thị Nở',
    description: 'Cơm ngon Hà Đông tại Cơm Thị Nở: cơm quê Bắc Bộ, cơm niêu, cá kho, canh cua cà pháo, đặt cơm văn phòng và mâm gia đình ở Văn Quán.',
    keywords: 'cơm ngon Hà Đông, quán cơm ngon Hà Đông, cơm quê Hà Đông, cơm văn phòng Hà Đông, Cơm Thị Nở',
    category: 'local',
    heroLabel: 'Cơm ngon Hà Đông',
    intro: 'Cơm Thị Nở là gợi ý cho thực khách đang tìm cơm ngon Hà Đông, đặc biệt quanh Văn Quán, Nguyễn Khuyến, Phúc La, Mỗ Lao và Trần Phú.',
    sections: [
      {
        heading: 'Một bữa cơm nóng, dễ ăn ở Hà Đông',
        body: ['Quán tập trung vào cơm quê Bắc Bộ với các món quen thuộc như cá kho riềng, thịt rang cháy cạnh, canh cua cà pháo, rau xào theo mùa và cơm niêu. Đây là lựa chọn hợp cho bữa trưa văn phòng, bữa tối gia đình hoặc nhóm bạn muốn ăn cơm mâm.'],
      },
      {
        heading: 'Khu vực khách thường đặt',
        body: ['Khách quanh KĐT Văn Quán, Nguyễn Khuyến, Chiến Thắng, Phúc La, Mỗ Lao, Trần Phú có thể gọi trước để quán tư vấn món và chuẩn bị theo giờ hẹn.'],
      },
      {
        heading: 'Gợi ý gọi món',
        body: ['Nếu đi nhóm 3-6 người, khách có thể chọn một món kho, một món rang/xào, một món canh và rau theo mùa. Với đơn công ty, quán hỗ trợ thực đơn theo ngân sách.'],
      },
    ],
    faqs: [
      { question: 'Cơm Thị Nở ở đâu tại Hà Đông?', answer: `Quán ở ${restaurantInfo.address}.` },
      { question: 'Có nhận đặt cơm văn phòng Hà Đông không?', answer: 'Có. Khách nên gọi trước để quán chuẩn bị số lượng và khung giờ phù hợp.' },
    ],
    related: commonRelated,
  },
  {
    path: '/com-ngon-van-quan',
    title: 'Cơm ngon Văn Quán',
    seoTitle: 'Cơm ngon Văn Quán | Cơm niêu, cơm gia đình Nguyễn Khuyến',
    description: 'Cơm ngon Văn Quán tại Cơm Thị Nở Nguyễn Khuyến: cơm quê Bắc Bộ, cơm niêu, cá kho, canh cua, đặt cơm văn phòng và mâm cơm gia đình.',
    keywords: 'cơm ngon Văn Quán, quán cơm ngon Văn Quán, cơm Nguyễn Khuyến, cơm gia đình Văn Quán, Cơm Thị Nở',
    category: 'local',
    heroLabel: 'Cơm ngon Văn Quán',
    intro: 'Ngay khu Nguyễn Khuyến, KĐT Văn Quán, Cơm Thị Nở phục vụ những bữa cơm quê Bắc Bộ nóng hổi cho khách ăn tại quán, đặt mâm hoặc đặt cơm văn phòng.',
    sections: [
      {
        heading: 'Vị trí thuận tiện quanh Văn Quán',
        body: ['Quán phù hợp khách ở gần hồ Văn Quán, Nguyễn Khuyến, Chiến Thắng, Phúc La và các văn phòng quanh khu đô thị. Khách có thể gọi trước để kiểm tra món trong ngày hoặc đặt mâm theo số người.'],
      },
      {
        heading: 'Món hợp bữa trưa và bữa tối',
        body: ['Các món như cơm niêu, cá kho riềng, canh cua cà pháo, thịt rang cháy cạnh và rau xào theo mùa tạo thành mâm cơm đủ vị, hợp cả gia đình lẫn nhóm đồng nghiệp.'],
      },
    ],
    faqs: [
      { question: 'Có nên đặt trước khi ăn trưa ở Văn Quán không?', answer: 'Nên đặt trước nếu đi nhóm hoặc cần món lên nhanh trong giờ trưa.' },
      { question: 'Có nhận đặt mâm gia đình không?', answer: 'Có. Quán tư vấn mâm theo số người, khẩu vị và ngân sách.' },
    ],
    related: commonRelated,
  },
  {
    path: '/quan-com-ngon-van-quan',
    title: 'Quán cơm ngon Văn Quán',
    seoTitle: 'Quán cơm ngon Văn Quán | Cơm Thị Nở Nguyễn Khuyến',
    description: 'Cơm Thị Nở là quán cơm ngon Văn Quán, phục vụ cơm quê Bắc Bộ, cơm niêu, cá kho, canh cua cà pháo, cơm văn phòng và mâm gia đình.',
    keywords: 'quán cơm ngon Văn Quán, cơm ngon Văn Quán, quán cơm Nguyễn Khuyến, cơm gia đình Văn Quán, cơm văn phòng Văn Quán',
    category: 'local',
    heroLabel: 'Quán cơm ngon Văn Quán',
    intro: 'Cơm Thị Nở phục vụ khách quanh Văn Quán bằng những mâm cơm Bắc Bộ gần gũi, hợp ăn trưa, ăn tối, đặt cơm văn phòng và đi cùng gia đình.',
    sections: [
      {
        heading: 'Điểm mạnh của quán',
        body: ['Quán chọn nhóm món quen thuộc trong bữa cơm gia đình: cơm niêu, cá kho, canh cua, thịt rang, rau theo mùa. Cách gọi món linh hoạt theo suất, theo mâm hoặc theo nhóm khách.'],
      },
      {
        heading: 'Phù hợp nhiều nhu cầu ở Văn Quán',
        body: ['Khách có thể ghé ăn cơm trưa, đặt mâm gia đình buổi tối hoặc đặt cơm công ty quanh Nguyễn Khuyến, Phúc La, Chiến Thắng và khu đô thị Văn Quán.'],
      },
      {
        heading: 'Gợi ý khi đi nhóm',
        body: ['Với nhóm 4-6 người, nên gọi đủ món mặn, canh, rau và món kèm. Với nhóm công ty, nên báo trước số lượng để quán chuẩn bị đúng giờ.'],
      },
    ],
    faqs: [
      { question: 'Quán cơm ngon Văn Quán này có món gì nổi bật?', answer: 'Các món được gợi ý gồm cơm niêu, cá kho riềng, canh cua cà pháo, thịt rang cháy cạnh và rau xào theo mùa.' },
      { question: 'Có nhận đặt cơm cho công ty quanh Văn Quán không?', answer: 'Có. Khách có thể gọi hotline để tư vấn thực đơn và giờ nhận cơm.' },
    ],
    related: commonRelated,
  },
  {
    path: '/thuc-don',
    title: 'Thực đơn Cơm Thị Nở',
    seoTitle: 'Thực đơn Cơm Thị Nở | Cơm ngon Hà Đông, Văn Quán',
    description: 'Xem thực đơn Cơm Thị Nở tại Văn Quán, Hà Đông: cơm niêu, cá kho riềng, canh cua cà pháo, thịt rang cháy cạnh, mâm cơm gia đình và cơm văn phòng.',
    keywords: 'thực đơn Cơm Thị Nở, thực đơn cơm Hà Đông, cơm ngon Văn Quán, cơm niêu Hà Đông, mâm cơm gia đình',
    category: 'menu',
    heroLabel: 'Thực đơn',
    intro: 'Thực đơn Cơm Thị Nở tập trung vào những món cơm quê Bắc Bộ dễ ăn, hợp bữa trưa văn phòng, bữa tối gia đình và mâm cơm đoàn tại khu vực Văn Quán, Hà Đông.',
    sections: [
      {
        heading: 'Nhóm món được gọi nhiều',
        body: ['Các món được khách gọi nhiều là cơm niêu, cá kho riềng, canh cua cà pháo, thịt lợn rang cháy cạnh, sườn xào chua ngọt, rau xào theo mùa và các món ăn kèm dân dã.'],
        bullets: ['Cơm niêu nóng, cơm trắng dẻo thơm', 'Cá kho riềng đậm vị, hợp ăn cùng canh rau', 'Canh cua cà pháo, rau luộc, món xào theo mùa', 'Mâm cơm 4-6 người hoặc đặt đoàn theo ngân sách'],
      },
      {
        heading: 'Phù hợp đặt cơm văn phòng và mâm gia đình',
        body: ['Khách có thể đặt theo suất, theo mâm hoặc theo nhóm món. Với đơn công ty, quán tư vấn thực đơn dễ ăn, đủ món mặn, canh, rau và món kèm để bữa trưa gọn nhưng vẫn ấm bụng.'],
      },
      {
        heading: 'Khu vực phục vụ',
        body: ['Quán phục vụ khách quanh Nguyễn Khuyến, KĐT Văn Quán, Phúc La, Chiến Thắng, Trần Phú, Mỗ Lao và các khu văn phòng lân cận Hà Đông.'],
      },
    ],
    faqs: [
      { question: 'Có cần đặt trước không?', answer: 'Khách đi nhóm hoặc đặt cơm văn phòng nên gọi trước để quán chuẩn bị món nóng và đúng giờ.' },
      { question: 'Có nhận mâm cơm gia đình không?', answer: 'Có. Quán nhận mâm cơm theo số người, khẩu vị và ngân sách.' },
    ],
    related: commonRelated,
  },
  {
    path: '/mon-an/ca-kho-rieng',
    title: 'Cá kho riềng Cơm Thị Nở',
    seoTitle: 'Cá kho riềng Hà Đông | Món cơm quê tại Cơm Thị Nở',
    description: 'Cá kho riềng đậm vị Bắc Bộ tại Cơm Thị Nở, hợp ăn cùng cơm niêu, canh cua cà pháo và mâm cơm gia đình ở Văn Quán, Hà Đông.',
    keywords: 'cá kho riềng Hà Đông, cá kho Văn Quán, cơm quê Bắc Bộ, món ngon Hà Đông, Cơm Thị Nở',
    category: 'dish',
    heroLabel: 'Món ăn',
    intro: 'Cá kho riềng là một trong những món mặn hợp cơm nhất trong mâm cơm Bắc Bộ, vị đậm, thơm riềng và rất hợp khi ăn cùng cơm nóng.',
    sections: [
      {
        heading: 'Hương vị món cá kho riềng',
        body: ['Món cá kho riềng tại Cơm Thị Nở hướng đến vị đậm vừa phải, thơm mùi riềng, ăn cùng cơm niêu hoặc cơm trắng nóng. Đây là món hợp cho khách thích mâm cơm quê, dễ ăn và không quá cầu kỳ.'],
      },
      {
        heading: 'Gợi ý kết hợp món',
        body: ['Một mâm cơm cân bằng có thể gồm cá kho riềng, canh cua cà pháo, rau luộc hoặc rau xào, thêm món thịt rang cháy cạnh cho nhóm đông người.'],
        bullets: ['Ăn trưa văn phòng cần món đậm vị', 'Mâm gia đình 3-6 người', 'Đặt cơm đoàn muốn có món truyền thống dễ ăn'],
      },
    ],
    faqs: [
      { question: 'Cá kho riềng hợp ăn với món gì?', answer: 'Hợp nhất với cơm nóng, canh cua, rau luộc, cà pháo hoặc rau xào theo mùa.' },
      { question: 'Có thể đặt cá kho riềng cho mâm cơm đoàn không?', answer: 'Có. Khách nên gọi trước để quán chuẩn bị số lượng phù hợp.' },
    ],
    related: [
      { label: 'Canh cua cà pháo', href: '/mon-an/canh-cua-ca-phao' },
      ...commonRelated,
    ],
  },
  {
    path: '/mon-an/canh-cua-ca-phao',
    title: 'Canh cua cà pháo',
    seoTitle: 'Canh cua cà pháo Hà Đông | Món quê Bắc Bộ tại Văn Quán',
    description: 'Canh cua cà pháo dân dã tại Cơm Thị Nở, món ăn hợp cơm trưa và mâm cơm gia đình ở Văn Quán, Hà Đông.',
    keywords: 'canh cua cà pháo Hà Đông, canh cua Văn Quán, món quê Bắc Bộ, cơm ngon Hà Đông',
    category: 'dish',
    heroLabel: 'Món ăn',
    intro: 'Canh cua cà pháo là món gợi nhớ bữa cơm quê Bắc Bộ: thanh, mát, dễ ăn và hợp với những món mặn đậm vị.',
    sections: [
      {
        heading: 'Món canh cân bằng mâm cơm',
        body: ['Trong mâm cơm Cơm Thị Nở, canh cua cà pháo thường được khách chọn để cân bằng với cá kho, thịt rang hoặc sườn xào. Món canh giúp bữa ăn nhẹ hơn, hợp cả trưa và tối.'],
      },
      {
        heading: 'Phù hợp nhiều nhóm khách',
        body: ['Món này hợp với khách văn phòng muốn bữa trưa dễ ăn, khách gia đình thích hương vị quen thuộc và khách đoàn muốn một mâm cơm có đủ canh, mặn, rau.'],
      },
    ],
    faqs: [
      { question: 'Canh cua cà pháo có trong thực đơn hằng ngày không?', answer: 'Thực đơn có thể thay đổi theo ngày. Khách nên gọi hotline để kiểm tra trước khi đến hoặc đặt cơm.' },
      { question: 'Có thể đặt kèm cơm niêu không?', answer: 'Có. Canh cua cà pháo rất hợp ăn cùng cơm niêu và các món kho/rang.' },
    ],
    related: [
      { label: 'Cá kho riềng', href: '/mon-an/ca-kho-rieng' },
      ...commonRelated,
    ],
  },
  {
    path: '/com-van-phong-ha-dong',
    title: 'Cơm văn phòng Hà Đông',
    seoTitle: 'Cơm văn phòng Hà Đông | Đặt cơm trưa Văn Quán',
    description: 'Đặt cơm văn phòng Hà Đông tại Cơm Thị Nở: thực đơn cơm quê Bắc Bộ, giao khu Văn Quán, Nguyễn Khuyến, Phúc La, Mỗ Lao, Trần Phú.',
    keywords: 'cơm văn phòng Hà Đông, đặt cơm trưa Hà Đông, cơm văn phòng Văn Quán, cơm công ty Hà Đông',
    category: 'local',
    heroLabel: 'Cơm văn phòng',
    intro: 'Cơm Thị Nở nhận đặt cơm văn phòng Hà Đông cho nhóm nhỏ, nhóm công ty và khách cần bữa trưa sạch, dễ ăn, đúng giờ quanh Văn Quán.',
    sections: [
      {
        heading: 'Thực đơn phù hợp bữa trưa công sở',
        body: ['Bữa trưa văn phòng cần gọn, đủ chất và không bị ngán. Quán tư vấn thực đơn gồm món mặn, canh, rau và món kèm để nhân sự dễ chọn theo khẩu vị chung.'],
        bullets: ['Món mặn: cá kho, thịt rang, sườn xào, gà rang', 'Canh: canh cua, canh chua, canh rau theo mùa', 'Rau và món kèm: rau xào, rau luộc, cà pháo, trứng'],
      },
      {
        heading: 'Khu vực nhận đặt và giao',
        body: ['Quán ưu tiên khu vực Văn Quán, Nguyễn Khuyến, Phúc La, Mỗ Lao, Trần Phú, Chiến Thắng và các văn phòng trong bán kính gần Hà Đông. Với đơn đông người, khách nên chốt trước giờ cao điểm.'],
      },
      {
        heading: 'Giá và hình thức đặt',
        body: ['Khách có thể đặt theo suất, theo mâm hoặc theo ngân sách. Với đơn công ty cần hóa đơn VAT, vui lòng báo trước để quán hỗ trợ thông tin phù hợp.'],
      },
    ],
    faqs: [
      { question: 'Đặt cơm văn phòng cần báo trước bao lâu?', answer: 'Nên báo trước buổi sáng, đặc biệt với đơn nhóm từ 10 người trở lên.' },
      { question: 'Có hỗ trợ hóa đơn VAT không?', answer: 'Có hỗ trợ theo yêu cầu của công ty. Khách nên báo thông tin khi đặt đơn.' },
    ],
    related: [
      { label: 'Đặt cơm văn phòng Văn Quán', href: '/dat-com-van-phong-van-quan' },
      { label: 'Hóa đơn VAT/đặt cơm công ty', href: '/hoa-don-vat-dat-com-cong-ty' },
      ...commonRelated,
    ],
  },
  {
    path: '/dat-com-van-phong-van-quan',
    title: 'Đặt cơm văn phòng Văn Quán',
    seoTitle: 'Đặt cơm văn phòng Văn Quán | Cơm trưa Nguyễn Khuyến',
    description: 'Cơm Thị Nở nhận đặt cơm văn phòng Văn Quán, cơm trưa khu Nguyễn Khuyến, Phúc La, Chiến Thắng, giao đúng giờ cho nhóm công ty.',
    keywords: 'đặt cơm văn phòng Văn Quán, cơm trưa Văn Quán, cơm văn phòng Nguyễn Khuyến, đặt cơm công ty Hà Đông',
    category: 'local',
    heroLabel: 'Đặt cơm',
    intro: 'Nếu văn phòng của bạn ở Văn Quán, Nguyễn Khuyến, Phúc La hoặc Chiến Thắng, Cơm Thị Nở có thể tư vấn bữa trưa theo số lượng người và ngân sách.',
    sections: [
      {
        heading: 'Quy trình đặt cơm nhanh',
        body: ['Khách gửi số người, khung giờ nhận, ngân sách dự kiến và món muốn ưu tiên. Quán gợi ý thực đơn cân bằng giữa món mặn, canh, rau, món kèm và xác nhận lại trước khi chuẩn bị.'],
        bullets: ['Gọi hotline hoặc nhắn Zalo', 'Chốt số lượng và giờ nhận', 'Quán chuẩn bị món nóng đúng giờ', 'Hỗ trợ đơn lặp lại theo tuần nếu công ty cần'],
      },
      {
        heading: 'Gợi ý combo phổ biến',
        body: ['Nhóm 5-10 người có thể đặt mâm cơm gia đình. Nhóm 10-30 người nên chọn thực đơn theo suất hoặc mâm chia sẵn để thuận tiện khi ăn tại văn phòng.'],
      },
    ],
    faqs: [
      { question: 'Có nhận đặt lặp lại theo tuần không?', answer: 'Có. Khách công ty có thể trao đổi thực đơn xoay vòng theo ngày.' },
      { question: 'Có giao đúng giờ trưa không?', answer: 'Quán ưu tiên đơn đặt trước và khung giờ đã xác nhận với khách.' },
    ],
    related: commonRelated,
  },
  {
    path: '/an-gi-o-van-quan-ha-dong',
    title: 'Ăn gì ở Văn Quán Hà Đông?',
    seoTitle: 'Ăn gì ở Văn Quán Hà Đông buổi trưa? Gợi ý Cơm Thị Nở',
    description: 'Gợi ý ăn gì ở Văn Quán Hà Đông buổi trưa: cơm quê Bắc Bộ, cơm niêu, cá kho, canh cua cà pháo tại Cơm Thị Nở Nguyễn Khuyến.',
    keywords: 'ăn gì ở Văn Quán Hà Đông, ăn trưa Văn Quán, cơm ngon Văn Quán, quán ăn Hà Đông',
    category: 'local',
    heroLabel: 'Gợi ý địa phương',
    intro: 'Văn Quán có nhiều lựa chọn ăn trưa, nhưng nếu bạn muốn một bữa cơm nóng, dễ ăn, có vị gia đình thì Cơm Thị Nở là một gợi ý đáng thử.',
    sections: [
      {
        heading: 'Khi nào nên chọn cơm quê Bắc Bộ?',
        body: ['Cơm quê phù hợp khi bạn cần một bữa no vừa, không quá dầu mỡ, có món mặn, canh và rau. Đây cũng là lựa chọn hợp với nhóm văn phòng vì dễ chia món và dễ chọn theo khẩu vị chung.'],
      },
      {
        heading: 'Gợi ý món cho bữa trưa Văn Quán',
        body: ['Một bữa trưa gọn có thể gồm cơm niêu, cá kho riềng, canh cua cà pháo, rau xào theo mùa. Nhóm đông có thể thêm thịt rang cháy cạnh hoặc sườn xào chua ngọt.'],
      },
      {
        heading: 'Địa chỉ dễ tìm',
        body: [`Cơm Thị Nở ở ${restaurantInfo.address}, thuận tiện cho khách quanh hồ Văn Quán, Nguyễn Khuyến, Phúc La và Chiến Thắng.`],
      },
    ],
    faqs: [
      { question: 'Cơm Thị Nở hợp đi ăn gia đình không?', answer: 'Có. Quán có các món theo mâm, phù hợp gia đình hoặc nhóm bạn.' },
      { question: 'Buổi trưa có nên đặt trước không?', answer: 'Nên đặt trước nếu đi nhóm hoặc cần món lên nhanh trong giờ nghỉ trưa.' },
    ],
    related: commonRelated,
  },
  {
    path: '/quan-com-gia-dinh-ha-dong',
    title: 'Quán cơm gia đình Hà Đông',
    seoTitle: 'Quán cơm gia đình Hà Đông | Mâm cơm Bắc Bộ Văn Quán',
    description: 'Cơm Thị Nở là quán cơm gia đình tại Hà Đông, phục vụ mâm cơm Bắc Bộ, cơm niêu, cá kho, canh cua cà pháo ở KĐT Văn Quán.',
    keywords: 'quán cơm gia đình Hà Đông, cơm gia đình Văn Quán, mâm cơm Bắc Bộ Hà Đông, cơm ngon Hà Đông',
    category: 'local',
    heroLabel: 'Cơm gia đình',
    intro: 'Cơm Thị Nở phục vụ mâm cơm gia đình cho khách muốn một bữa ăn ấm cúng, có món mặn, canh, rau và hương vị quen thuộc.',
    sections: [
      {
        heading: 'Không khí bữa cơm gia đình',
        body: ['Mâm cơm gia đình không cần cầu kỳ, nhưng cần món dễ ăn và đủ vị. Quán tập trung vào món Bắc Bộ quen thuộc, hợp người lớn tuổi, trẻ em và nhóm gia đình nhiều khẩu vị.'],
      },
      {
        heading: 'Gợi ý mâm cơm 4-6 người',
        body: ['Có thể chọn cá kho riềng, thịt rang cháy cạnh, canh cua cà pháo, rau xào theo mùa, trứng hoặc món ăn kèm. Khách có thể gọi trước để quán tư vấn theo số người.'],
      },
    ],
    faqs: [
      { question: 'Có nhận đặt mâm theo ngân sách không?', answer: 'Có. Khách báo số người và ngân sách, quán sẽ gợi ý món phù hợp.' },
      { question: 'Quán ở khu nào Hà Đông?', answer: `Quán ở ${restaurantInfo.address}.` },
    ],
    related: commonRelated,
  },
  {
    path: '/gioi-thieu',
    title: 'Giới thiệu Cơm Thị Nở',
    seoTitle: 'Giới thiệu Cơm Thị Nở | Cơm quê Bắc Bộ tại Văn Quán',
    description: 'Cơm Thị Nở phục vụ cơm quê Bắc Bộ, cơm niêu, cơm văn phòng và mâm cơm gia đình tại A16TT18 Nguyễn Khuyến, Văn Quán, Hà Đông.',
    keywords: 'giới thiệu Cơm Thị Nở, cơm quê Bắc Bộ Hà Đông, quán cơm Văn Quán, cơm ngon Hà Đông',
    category: 'trust',
    heroLabel: 'Giới thiệu',
    intro: 'Cơm Thị Nở được xây dựng như một địa chỉ cơm quê Bắc Bộ tại Văn Quán, Hà Đông, phục vụ những bữa cơm nóng, dễ ăn và gần gũi.',
    sections: [
      {
        heading: 'Câu chuyện của quán',
        body: ['Quán chọn phong vị cơm quê Bắc Bộ làm điểm nhận diện: món kho, món rang, canh cua, rau theo mùa và mâm cơm gia đình. Tinh thần chính là bữa ăn đủ đầy, gọn gàng và ấm bụng.'],
      },
      {
        heading: 'Khách hàng phục vụ',
        body: ['Cơm Thị Nở phục vụ khách gia đình, dân văn phòng, nhóm bạn và khách đặt cơm đoàn quanh Hà Đông. Quán nhận tư vấn thực đơn theo số lượng và mục đích bữa ăn.'],
      },
    ],
    related: commonRelated,
  },
  {
    path: '/lien-he',
    title: 'Liên hệ Cơm Thị Nở',
    seoTitle: 'Liên hệ Cơm Thị Nở | Đặt cơm Hà Đông, Văn Quán',
    description: 'Liên hệ Cơm Thị Nở để đặt bàn, đặt cơm văn phòng, đặt mâm cơm gia đình tại A16TT18 Nguyễn Khuyến, Văn Quán, Hà Đông.',
    keywords: 'liên hệ Cơm Thị Nở, đặt cơm Hà Đông, hotline Cơm Thị Nở, địa chỉ Cơm Thị Nở',
    category: 'trust',
    heroLabel: 'Liên hệ',
    intro: `Cơm Thị Nở ở ${restaurantInfo.address}. Khách có thể gọi hotline ${restaurantInfo.phone} để đặt bàn, đặt cơm văn phòng hoặc hỏi thực đơn trong ngày.`,
    sections: [
      {
        heading: 'Thông tin liên hệ',
        body: [`Địa chỉ: ${restaurantInfo.address}.`, `Hotline: ${restaurantInfo.phone}.`, `Giờ phục vụ: ${restaurantInfo.hours}.`],
      },
      {
        heading: 'Khi nào nên gọi trước?',
        body: ['Nên gọi trước nếu đi nhóm, đặt cơm đoàn, đặt cơm văn phòng hoặc muốn kiểm tra món trong ngày. Việc đặt trước giúp quán chuẩn bị món nóng và phục vụ đúng giờ hơn.'],
      },
    ],
    related: commonRelated,
  },
  {
    path: '/chinh-sach-dat-com-giao-hang',
    title: 'Chính sách đặt cơm và giao hàng',
    seoTitle: 'Chính sách đặt cơm, giao hàng | Cơm Thị Nở Hà Đông',
    description: 'Thông tin đặt cơm, xác nhận đơn, thời gian chuẩn bị và giao hàng của Cơm Thị Nở tại khu vực Văn Quán, Hà Đông.',
    keywords: 'chính sách đặt cơm Hà Đông, giao cơm Văn Quán, đặt cơm Cơm Thị Nở',
    category: 'trust',
    heroLabel: 'Chính sách',
    intro: 'Chính sách đặt cơm giúp khách chủ động thời gian, số lượng và món ăn, đặc biệt với đơn văn phòng hoặc mâm cơm đoàn.',
    sections: [
      {
        heading: 'Cách xác nhận đơn',
        body: ['Đơn được xác nhận sau khi khách cung cấp số người, món cần đặt, thời gian nhận, địa chỉ và số điện thoại liên hệ. Với đơn lớn, quán có thể gọi lại để chốt thực đơn.'],
      },
      {
        heading: 'Thời gian chuẩn bị và giao',
        body: ['Giờ cao điểm buổi trưa thường cần chuẩn bị sớm hơn. Khách đặt cơm văn phòng nên báo trước để quán ưu tiên khung giờ nhận hàng.'],
      },
    ],
    related: [
      { label: 'Đặt cơm văn phòng Văn Quán', href: '/dat-com-van-phong-van-quan' },
      ...commonRelated,
    ],
  },
  {
    path: '/chinh-sach-doi-huy-don',
    title: 'Chính sách đổi và hủy đơn',
    seoTitle: 'Chính sách đổi, hủy đơn | Cơm Thị Nở Văn Quán',
    description: 'Quy định đổi món, điều chỉnh số lượng và hủy đơn đặt cơm tại Cơm Thị Nở, áp dụng cho khách lẻ, khách đoàn và cơm văn phòng.',
    keywords: 'chính sách hủy đơn cơm, đổi món đặt cơm, Cơm Thị Nở Văn Quán',
    category: 'trust',
    heroLabel: 'Chính sách',
    intro: 'Chính sách đổi/hủy đơn giúp hai bên chủ động khi số lượng khách thay đổi hoặc cần điều chỉnh thực đơn.',
    sections: [
      {
        heading: 'Điều chỉnh đơn',
        body: ['Khách nên báo thay đổi số lượng hoặc món càng sớm càng tốt. Với đơn đang chuẩn bị hoặc đã giao, khả năng đổi/hủy sẽ phụ thuộc vào tình trạng thực tế của món.'],
      },
      {
        heading: 'Đơn công ty và đơn đoàn',
        body: ['Đơn số lượng lớn nên chốt trước giờ hẹn để quán chuẩn bị nguyên liệu và nhân sự phục vụ đúng lịch. Nếu cần thay đổi, vui lòng gọi hotline để được hỗ trợ nhanh.'],
      },
    ],
    related: commonRelated,
  },
  {
    path: '/hoa-don-vat-dat-com-cong-ty',
    title: 'Hóa đơn VAT và đặt cơm công ty',
    seoTitle: 'Hóa đơn VAT, đặt cơm công ty Hà Đông | Cơm Thị Nở',
    description: 'Cơm Thị Nở hỗ trợ khách công ty đặt cơm văn phòng, cơm đoàn và thông tin hóa đơn VAT theo yêu cầu tại Hà Đông, Văn Quán.',
    keywords: 'hóa đơn VAT cơm công ty, đặt cơm công ty Hà Đông, cơm văn phòng xuất hóa đơn, Cơm Thị Nở',
    category: 'trust',
    heroLabel: 'Cơm công ty',
    intro: 'Với khách doanh nghiệp, Cơm Thị Nở hỗ trợ đặt cơm theo nhóm, theo ngân sách và cung cấp thông tin hóa đơn theo yêu cầu.',
    sections: [
      {
        heading: 'Thông tin cần chuẩn bị',
        body: ['Khách công ty nên gửi tên đơn vị, mã số thuế, địa chỉ xuất hóa đơn, email nhận hóa đơn và thông tin người phụ trách đơn hàng để quán hỗ trợ nhanh.'],
      },
      {
        heading: 'Đặt cơm công ty theo lịch',
        body: ['Nếu công ty đặt định kỳ, quán có thể tư vấn thực đơn xoay vòng theo ngày để bữa trưa không bị lặp món.'],
      },
    ],
    related: [
      { label: 'Cơm văn phòng Hà Đông', href: '/com-van-phong-ha-dong' },
      { label: 'Đặt cơm văn phòng Văn Quán', href: '/dat-com-van-phong-van-quan' },
      ...commonRelated,
    ],
  },
  {
    path: '/an-toan-thuc-pham-nguyen-lieu',
    title: 'An toàn thực phẩm và nguyên liệu',
    seoTitle: 'An toàn thực phẩm, nguyên liệu | Cơm Thị Nở Hà Đông',
    description: 'Cơm Thị Nở chú trọng nguyên liệu tươi, quy trình chuẩn bị món ăn và vệ sinh bếp để phục vụ cơm gia đình, cơm văn phòng tại Hà Đông.',
    keywords: 'an toàn thực phẩm cơm Hà Đông, nguyên liệu Cơm Thị Nở, cơm sạch Văn Quán',
    category: 'trust',
    heroLabel: 'Niềm tin',
    intro: 'Bữa cơm ngon phải bắt đầu từ nguyên liệu tươi, bếp sạch và quy trình chuẩn bị cẩn thận. Đây là nền tảng để Cơm Thị Nở phục vụ khách gia đình và văn phòng.',
    sections: [
      {
        heading: 'Nguyên liệu và món theo ngày',
        body: ['Quán ưu tiên nguyên liệu phù hợp trong ngày, chế biến món nóng và hạn chế chuẩn bị quá sớm với các món cần giữ độ ngon. Thực đơn có thể thay đổi theo mùa và tình trạng nguyên liệu.'],
      },
      {
        heading: 'Vệ sinh trong quá trình phục vụ',
        body: ['Khu vực bếp, dụng cụ và khâu đóng gói được kiểm soát để phù hợp cả khách ăn tại quán lẫn khách đặt mang đi/giao văn phòng.'],
      },
    ],
    related: commonRelated,
  },
  buildLocalLandingPage({
    path: '/com-que-ha-dong',
    title: 'Cơm quê Hà Đông',
    seoTitle: 'Cơm quê Hà Đông | Cơm Bắc Bộ tại Cơm Thị Nở',
    description: 'Cơm quê Hà Đông tại Cơm Thị Nở: món Bắc Bộ, cơm nóng, cá kho, thịt rang, canh cua, rau theo mùa, ăn tại quán hoặc đặt mang về.',
    keywords: 'cơm quê Hà Đông, cơm Bắc Bộ, Cơm Thị Nở, quán cơm Hà Đông, cơm Văn Quán',
    heroLabel: 'Cơm quê Hà Đông',
    primaryKeyword: 'Cơm quê Hà Đông',
    intent: 'ăn cơm quê, cơm Bắc Bộ và mâm cơm gia đình',
    service: 'cơm quê Hà Đông',
  }),
  buildLocalLandingPage({
    path: '/com-gia-dinh-ha-dong',
    title: 'Cơm gia đình Hà Đông',
    seoTitle: 'Cơm gia đình Hà Đông | Mâm cơm Bắc Bộ Văn Quán',
    description: 'Cơm gia đình Hà Đông tại Cơm Thị Nở: mâm cơm Bắc Bộ ấm cúng, món kho, canh, rau, cơm niêu, phù hợp gia đình và nhóm bạn.',
    keywords: 'cơm gia đình Hà Đông, mâm cơm gia đình Hà Đông, cơm Bắc Bộ Văn Quán, Cơm Thị Nở',
    heroLabel: 'Cơm gia đình',
    primaryKeyword: 'Cơm gia đình Hà Đông',
    intent: 'ăn cùng gia đình, đặt mâm và gặp mặt nhóm nhỏ',
    service: 'mâm cơm gia đình Hà Đông',
  }),
  buildLocalLandingPage({
    path: '/com-trua-van-phong-ha-dong',
    title: 'Cơm trưa văn phòng Hà Đông',
    seoTitle: 'Cơm trưa văn phòng Hà Đông | Đặt cơm Văn Quán',
    description: 'Đặt cơm trưa văn phòng Hà Đông tại Cơm Thị Nở: thực đơn dễ ăn, cơm nóng, món Bắc Bộ, nhận đơn nhóm quanh Văn Quán.',
    keywords: 'cơm trưa văn phòng Hà Đông, cơm văn phòng Hà Đông, đặt cơm trưa Văn Quán, cơm công ty Hà Đông',
    heroLabel: 'Cơm trưa văn phòng',
    primaryKeyword: 'Cơm trưa văn phòng Hà Đông',
    intent: 'đặt cơm trưa cho nhân sự, nhóm văn phòng và công ty',
    service: 'cơm trưa văn phòng Hà Đông',
  }),
  buildLocalLandingPage({
    path: '/com-van-quan',
    title: 'Cơm Văn Quán',
    seoTitle: 'Cơm Văn Quán | Quán cơm Bắc Bộ tại Nguyễn Khuyến',
    description: 'Cơm Văn Quán tại Cơm Thị Nở Nguyễn Khuyến: cơm Bắc Bộ, cơm văn phòng, cơm gia đình, món kho, canh cua và cơm mang về.',
    keywords: 'Cơm Văn Quán, cơm Nguyễn Khuyến, cơm ngon Văn Quán, Cơm Thị Nở, cơm Hà Đông',
    heroLabel: 'Cơm Văn Quán',
    primaryKeyword: 'Cơm Văn Quán',
    intent: 'ăn tại quán, đặt cơm văn phòng và cơm mang về quanh Văn Quán',
    service: 'cơm Văn Quán',
  }),
  buildLocalLandingPage({
    path: '/quan-com-ngon-ha-dong',
    title: 'Quán cơm ngon Hà Đông',
    seoTitle: 'Quán cơm ngon Hà Đông | Cơm Thị Nở Văn Quán',
    description: 'Quán cơm ngon Hà Đông Cơm Thị Nở phục vụ cơm Bắc Bộ, cơm văn phòng, cơm gia đình, cơm mang về tại Văn Quán.',
    keywords: 'quán cơm ngon Hà Đông, cơm ngon Hà Đông, cơm Bắc Bộ Hà Đông, Cơm Thị Nở, cơm Văn Quán',
    heroLabel: 'Quán cơm ngon Hà Đông',
    primaryKeyword: 'Quán cơm ngon Hà Đông',
    intent: 'tìm quán cơm ngon, dễ ăn và phù hợp nhiều nhóm khách',
    service: 'quán cơm ngon Hà Đông',
  }),
  buildLocalLandingPage({
    path: '/com-mang-ve-ha-dong',
    title: 'Cơm mang về Hà Đông',
    seoTitle: 'Cơm mang về Hà Đông | Đặt cơm nóng Văn Quán',
    description: 'Cơm mang về Hà Đông tại Cơm Thị Nở: đặt cơm nóng, món Bắc Bộ, đóng gói gọn, phù hợp bữa trưa văn phòng và bữa tối gia đình.',
    keywords: 'cơm mang về Hà Đông, đặt cơm mang về Văn Quán, cơm hộp Hà Đông, Cơm Thị Nở',
    heroLabel: 'Cơm mang về',
    primaryKeyword: 'Cơm mang về Hà Đông',
    intent: 'đặt món mang về, lấy nhanh và ăn tại nhà hoặc văn phòng',
    service: 'cơm mang về Hà Đông',
  }),
];

export const staticSeoPagesByPath = Object.fromEntries(staticSeoPages.map((page) => [page.path, page]));
