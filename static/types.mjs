const TYPES = {
  facility: {
    name_ja: '施設',
    atts: ['施設名', '休館日', '臨時開館日', '臨時休館日', '平日開館時間', '休日開館時間', '入館可能時間', '年末年始', 'URL', '備考'],
    status_congrestion: true,
  },
  store: {
    name_ja: '店舗',
    atts: ['店舗名', '定休日', '営業時間', 'お店から一言', 'URL', '備考'],
    status_congrestion: true,
  },
  container: {
    name_ja: '集約',
    atts: ['集約名', 'IDs', '備考'],
  },
  company: {
    name_ja: "事業所",
    atts: ["事業所名", "業種", "会社説明", "住所", "電話番号", "E-mail", "URL", "定休日", "SDGs","写真URL1","写真URL2","写真URL3", "動画URL1", "動画URL2", "動画URL3", "緯度", "経度"],
  },
  mayorcandidate: {
    name_ja: '市長候補',
    atts: ['市長候補名', 'プロフィール写真URL', 'キャッチフレーズ', '公式サイトURL', 'ブログ', 'Facebook', 'Twitter', 'YouTube', 'Instagram', '候補時年齢', '出身地', '職歴', '学歴'],
  },
  event: {
    name_ja: "イベント",
    atts: ["日付", "定員", "価格", "タグ", "E-mail", "電話番号", "URL", "QR", "連絡先", "shop情報", "写真"],
  },
  vaccine: {
    name_ja: "ワクチン",
    atts: ["医療機関名", "空き状況", "市町名", "住所", "申込先名", "申込電話番号", "申込URL", "申込期限", "備考"],
    types: { "空き状況" : "date", "市町名": ["福井市", "敦賀市", "小浜市", "大野市", "勝山市", "鯖江市", "あわら市", "越前市", "坂井市", "永平寺町", "池田町", "南越前町", "越前町", "美浜町", "高浜町", "おおい町", "若狭町"] },
  },
};

export default TYPES;
