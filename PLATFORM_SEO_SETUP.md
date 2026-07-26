# Platform SEO Setup - Cơm Thị Nở

## 1. Website environment values

Set these values before `npm run build` on production. Leave a value empty if you do not use that platform yet.

```env
VITE_GOOGLE_SITE_VERIFICATION=
VITE_GOOGLE_TAG_MANAGER_ID=
VITE_GOOGLE_ANALYTICS_ID=
VITE_FACEBOOK_APP_ID=
VITE_META_PIXEL_ID=
```

Notes:

- Prefer `VITE_GOOGLE_TAG_MANAGER_ID` if you have GTM. If GTM is set, the build skips direct GA injection to avoid duplicate tracking.
- `VITE_FACEBOOK_APP_ID` is safe for frontend Open Graph/Insights.
- Never put Facebook App Secret in frontend env. Use App Secret only on backend/server for Graph API jobs.

## 2. Google Search Console

Recommended property:

- Create a Domain property for `comthino.com`.
- Verify through DNS TXT if possible.
- Add URL-prefix property `https://comthino.com/` if you want quick HTML tag verification.

After deploy:

- Submit `https://comthino.com/sitemap.xml`.
- Inspect and request indexing for:
  - `https://comthino.com/`
  - `https://comthino.com/com-ngon-ha-dong`
  - `https://comthino.com/com-ngon-van-quan`
  - `https://comthino.com/quan-com-ngon-van-quan`
  - `https://comthino.com/thuc-don`
  - `https://comthino.com/com-van-phong-ha-dong`

## 3. Google Business Profile / Maps

Core NAP:

- Name: `Cơm Thị Nở`
- Primary category: Restaurant / Vietnamese restaurant / Rice restaurant, choose the closest available category.
- Address: `A16TT18 Nguyễn Khuyến, KĐT Văn Quán, Hà Đông, Hà Nội`
- Phone: `0971.170.103`
- Website: `https://comthino.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp_website`
- Menu URL: `https://comthino.com/thuc-don?utm_source=google&utm_medium=organic&utm_campaign=gbp_menu`
- Order/Food link: `https://comthino.com/dat-com-van-phong-van-quan?utm_source=google&utm_medium=organic&utm_campaign=gbp_order`

Profile content to fill:

- Business description: `Cơm Thị Nở phục vụ cơm quê Bắc Bộ, cơm niêu, mâm cơm gia đình, cơm văn phòng và đặt cơm đoàn tại A16TT18 Nguyễn Khuyến, KĐT Văn Quán, Hà Đông.`
- Service areas: Văn Quán, Hà Đông, Nguyễn Khuyến, Phúc La, Mỗ Lao, Trần Phú, Chiến Thắng.
- Menu sections: Cơm niêu, Món kho, Món canh, Món rau, Mâm cơm gia đình, Cơm văn phòng.
- Add menu photos and item photos. Use real photos, not stock images.

Weekly operating cadence:

- 1-2 Google Posts/week: thực đơn hôm nay, món nổi bật, ưu đãi đặt cơm văn phòng.
- Upload 5-10 real photos/month: món ăn, mặt tiền, không gian, bếp, menu.
- Ask satisfied customers for reviews with natural prompts. Do not incentivize reviews.
- Reply to every review with local wording: Văn Quán, Hà Đông, món khách đã ăn.

## 4. Facebook / Meta

Page setup:

- Page name: `Cơm Thị Nở`
- Category: Restaurant / Vietnamese Restaurant / Food & Drink, choose closest available.
- Website: `https://comthino.com/?utm_source=facebook&utm_medium=social&utm_campaign=page_about`
- Phone: `0971.170.103`
- Address: same as Google Business Profile.
- About/bio: `Cơm quê Bắc Bộ, cơm niêu, cơm văn phòng và mâm cơm gia đình tại Văn Quán, Hà Đông.`
- CTA button: Call Now or Send Message.

Meta Business:

- Verify domain `comthino.com` in Business Manager if you run ads.
- Add `VITE_FACEBOOK_APP_ID` for Facebook Insights/Open Graph association.
- Add `VITE_META_PIXEL_ID` only when you actually use Meta Ads or remarketing.
- Use Facebook Sharing Debugger after deploy for each main URL and click scrape again.

Suggested posting cadence:

- 3-5 posts/week: món trong ngày, mâm cơm gia đình, khách đặt đoàn, cơm văn phòng.
- Pin one post with address, phone, Google Maps and menu link.
- Make album categories: Thực đơn, Món khách gọi nhiều, Không gian quán, Cơm văn phòng.

## 5. Citations / Local directories

Keep NAP exactly consistent:

- Business name: Cơm Thị Nở
- Address: A16TT18 Nguyễn Khuyến, KĐT Văn Quán, Hà Đông, Hà Nội
- Phone: 0971.170.103
- Website: https://comthino.com/

Priority listings:

- Google Business Profile
- Facebook Page
- Foody
- ShopeeFood / GrabFood if available
- Zalo Official Account
- Apple Maps
- Bing Places
- Local food directories that allow restaurant listings

Use the same description theme everywhere:

`Cơm Thị Nở phục vụ cơm quê Bắc Bộ, cơm niêu, cơm văn phòng, mâm cơm gia đình và đặt cơm đoàn tại Văn Quán, Hà Đông.`
