'use client';

import React from 'react';
import { Printer, CheckCircle2 } from 'lucide-react';

export interface SngplBillData {
  consumerNo: string;
  consumerName: string;
  address: string;
  address2?: string;
  cnic?: string;
  securityDeposit?: string;
  zoneBookPage?: string;
  tariffCategory?: string;
  issueDate: string;
  dueDate: string;
  billingMonth: string;
  meterNo: string;
  currentDate?: string;
  prevDate?: string;
  currReading: string;
  prevReading: string;
  differenceReading?: string;
  pressureFactor?: string;
  gasConsumedHm3: string;
  mmbtu?: string;
  gcv?: string;
  wobbeIndex?: string;
  gasCharges: string;
  provAdjustment?: string;
  meterRent: string;
  fixedCharges?: string;
  gst: string;
  rebateAdjustment?: string;
  securityDepositAmt?: string;
  currentBill?: string;
  arrears?: string;
  lateSurcharge: string;
  totalWithinDue: string;
  totalAfterDue: string;
  customerCenter?: string;
  customerCenterPhone?: string;
  qrCodeBase64?: string;
  barcodeBase64?: string;
  barcodeText?: string;
  paymentHistory?: Array<{
    month: string;
    hm3: string;
    currentBill: string;
    amountDue: string;
    payment: string;
  }>;
}

interface SngplOfficialBillDocumentProps {
  bill: SngplBillData;
  onPrint?: () => void;
}

const DEFAULT_QR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAADNElEQVR4Xu2XPa6rMBCFJ3LhjmwAiW2485ZgAyFsALbkzttA8gZw5wIx7wyQH13pFpl0TxdFUcIXZezjMz8Q/3bRzxvP64/8l2QhulGTw9pxffPNEFeiRk0yr11p7pQ4pBypD2vPX5BQ93HuAucyk0u5rK39irQOqzaLCFJfY/0ludFceWy9Jt+M9j3O52TXYLQps+FArf2hzmcE59PF+v31dnIfE1ybNXfbDFxfCue439KSRbbOHNOdxDtTMKP7hjTY/eiwdSE5Jn5qoCAWikJLwMRxvvm1fcRRkBzS5s0U4UG+O8aHqRxxNGTD1kkWi4BYNZfDkkqy+DQ6qtza+rr1vJvo1EBDaCU7kzWLS1Okyq44czXJLOfclzSUefeOmVhPOBK5+RrTeHqneWigIZtnDlL54J0WBNJCVy3JBTfMAAMWFD+Uq5d3FGSzPIiuc7d7hwNPp6Iagjdy4p3tqCtv6ijI5pohzPAO6krlkTRp4EMDDeFC2PTi5xbeCegYkOFcgYIsHvYxyDN4B3GyaHDE0ZBciAhrR6qZkei6f1WTxUqtmuLRaXmAj04NNAQdrGNUqST5gZxDHp9xVCQ2yN3RzoiDTjtxg6KlJosn2oux5DEW7l4aKMhGLIt1643qypkhUHdqoCHID6L5KuOJyTA18u+xagXZLCpxXdm5L5J8WcaocwUKktGrA12D2RwgJpS1skccHTGQAe2iL+gYBn374R0NOfq2GFA0QG80/FTnc5JjIwuX3jiTnyt6dQwFkZZowZG41JcGAo+kJxDgjr93fLcreZz5szdqCI4Xvt68THZTFDNKbVaTku4Wc0RaHPotvmJg+YasF242+Xt4h6RJPryjIVHsg1oFG96krb256nOyOKQsxn940PCuwXPeURD0xs1LBmNUlLpSEPCIoyH4uDcKtERRYrNEpwYqIokCiJaIspdkvjg10BDM/q2VeWeArgFJXD9OW0PwXNIzj5gpMA7gPT5rvIrIExhP8gQGDepreHVNJbF4SW+sRAMz+q8I7l0itZTwucJw4Rs9YUzWOGo8FKIErl1Iz8qnIPI8h0E4SNvZHKZO/ERPfrn+yB+R6x/JpKo3MZkufwAAAABJRU5ErkJggg==';
const DEFAULT_BARCODE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAAoAQAAAACnOx6EAAAAQ0lEQVR4XmP4mZzz5OzZ7eZcVsE7ctVyW5wmG6W5nd1xUy3lzMy5W9t8Ts40znlU8mg+w6jCUYWjCkcVjiocVUi6QgBKuUimH4j/EAAAAABJRU5ErkJggg==';

export default function SngplOfficialBillDocument({ bill, onPrint }: SngplOfficialBillDocumentProps) {
  const consumerNo     = bill.consumerNo     || '80479563688';
  const consumerName   = bill.consumerName   || 'MUHAMMAD KHALID S/O MUHAMMAD SHARIF';
  const address        = bill.address        || 'P.242 GALI HAJI SHAFIWALI MOH.PURAN PLAD';
  const address2       = bill.address2       || 'CHINIOT';
  const cnic           = bill.cnic           || '332********75-9';
  const security       = bill.securityDeposit || '12940/               0';
  const zoneBook       = bill.zoneBookPage   || '3233/ 818/ 76';
  const tariff         = bill.tariffCategory || 'DOMU-G';
  const issueDate      = bill.issueDate      || '07-09-2026';
  const dueDate        = bill.dueDate        || '21-09-2026';
  const billingMonth   = bill.billingMonth   || 'Aug 2026';
  const meterNo        = bill.meterNo        || 'ZN02500817833';
  const customerCenter = bill.customerCenter || 'BLOCK-W, CHOWK SATELLITE TOWN, NEAR HCOKY STADIUM, CHINIOT.';
  const customerPhone  = bill.customerCenterPhone || '0476-334270';
  const currDate    = bill.currentDate || '18-08-2026';
  const prevDate    = bill.prevDate    || '17-07-2026';
  const currReading = bill.currReading !== '—' ? bill.currReading : '00120000';
  const prevReading = bill.prevReading !== '—' ? bill.prevReading : '00024000';
  const diffReading = bill.differenceReading || '00096000';
  const pressureFactor = bill.pressureFactor || '0.29/1.0198';
  const gasConsumed    = bill.gasConsumedHm3 !== '—' ? bill.gasConsumedHm3 : '0.979';
  const mmbtu          = bill.mmbtu || '3.595';
  const gcv            = bill.gcv   || '1035';
  const wobbeIndex     = bill.wobbeIndex || '1312';
  const gasCharges   = bill.gasCharges   !== '—' ? bill.gasCharges   : '3,553.40';
  const provAdj      = bill.provAdjustment || '0';
  const meterRent    = bill.meterRent    !== '—' ? bill.meterRent    : '42.67';
  const fixedCharges = bill.fixedCharges || '1,600.00';
  const gst          = bill.gst          !== '—' ? bill.gst          : '935.29';
  const rebate       = bill.rebateAdjustment   || '0.00';
  const secDeposit   = bill.securityDepositAmt || '0.00';
  const currentBill  = bill.currentBill  || '6,131.36';
  const arrears      = bill.arrears      || '-7307.6/2';
  const lateSurcharge = bill.lateSurcharge !== '—' ? bill.lateSurcharge : '0.00';
  const totalWithin  = bill.totalWithinDue !== '—' ? bill.totalWithinDue : '-1,180';
  const totalAfter   = bill.totalAfterDue  !== '—' ? bill.totalAfterDue  : '-1,180';
  const qrCode   = bill.qrCodeBase64  || DEFAULT_QR;
  const barcode  = bill.barcodeBase64 || DEFAULT_BARCODE;
  const barcodeText = bill.barcodeText || '03000804795636880082600000210926000000118000000003';

  const history = bill.paymentHistory && bill.paymentHistory.length > 0 ? bill.paymentHistory : [
    { month: 'Jul 2026', hm3: '0.246', currentBill: '1,559.88',  amountDue: '-7,310',  payment: '0' },
    { month: 'Jun 2026', hm3: '0.000', currentBill: '21,694.38', amountDue: '-9,240',  payment: '0' },
    { month: 'Jun 2026', hm3: '0.000', currentBill: '371.00',    amountDue: '-8,870',  payment: '-39,010' },
    { month: 'May 2026', hm3: '0.000', currentBill: '8,075.97',  amountDue: '8,080',   payment: '0' },
    { month: 'Apr 2026', hm3: '0.000', currentBill: '9,578.51',  amountDue: '9,580',   payment: '9,580' },
    { month: 'Mar 2026', hm3: '0.000', currentBill: '2,186.63',  amountDue: '2,180',   payment: '2,180' },
    { month: 'Feb 2026', hm3: '2.377', currentBill: '24,764.08', amountDue: '24,640',  payment: '24,640' },
    { month: 'Jan 2026', hm3: '2.705', currentBill: '28,641.37', amountDue: '28,640',  payment: '31,450' },
    { month: 'Dec 2025', hm3: '1.598', currentBill: '13,455.56', amountDue: '13,460',  payment: '14,760' },
    { month: 'Nov 2025', hm3: '1.557', currentBill: '13,290.27', amountDue: '13,290',  payment: '13,290' },
    { month: 'Oct 2025', hm3: '1.414', currentBill: '9,727.38',  amountDue: '9,720',   payment: '9,720' },
    { month: 'Sep 2025', hm3: '1.676', currentBill: '14,309.82', amountDue: '14,310',  payment: '14,310' },
  ];

  const handlePrint = () => { if (onPrint) { onPrint(); } else if (typeof window !== 'undefined') { window.print(); } };

  // Scale factor: template is 1241x1754px, we display at ~760px wide
  const BILL_W = 1241;
  const BILL_H = 1754;
  const DISPLAY_W = 760;
  const scale = DISPLAY_W / BILL_W;

  return (
    <div className="sngpl-official-bill-container" style={{ width: '100%', overflowX: 'auto', background: '#e5e7eb', borderRadius: '12px', padding: '12px 0' }}>
      <div className="sngpl-bill-action-bar sngpl-bill-no-print" style={{ maxWidth: `${DISPLAY_W}px`, margin: '0 auto', padding: '10px 16px', background: '#fff', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-approved" style={{ fontSize: '11.5px', padding: '4px 12px', background: '#0284c7', color: '#fff', border: 'none' }}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Official SNGPL Duplicate Bill Layout (V25-7 Format)
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Account ID: <strong style={{ color: '#0f172a' }}>{consumerNo}</strong></span>
        </div>
        <button type="button" onClick={handlePrint} className="btn btn-primary" style={{ padding: '7px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Printer className="w-4 h-4" /><span>Print Official Bill / Save PDF</span>
        </button>
      </div>

      {/* Scaled bill wrapper: renders at true 1241px then CSS-scales down */}
      <div style={{ width: `${DISPLAY_W}px`, height: `${Math.round(BILL_H * scale)}px`, margin: '0 auto', overflow: 'hidden', position: 'relative' }}>
        <div
          id="sngpl-printable-bill"
          style={{
            fontFamily: 'sans-serif',
            width: `${BILL_W}px`,
            height: `${BILL_H}px`,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
        <div style={{ position: 'relative', width: `${BILL_W}px`, height: `${BILL_H}px` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sngpl-bill-template.jpg" alt="SNGPL Bill Template" style={{ width: `${BILL_W}px`, height: `${BILL_H}px`, display: 'block', position: 'absolute', top: 0, left: 0 }} />
          <div style={{ position: 'absolute', top: '0px', left: '10px', width: '97%', zIndex: 2 }}>
            <table width="98%" align="center" border={0} style={{ margin: '13px 0px 0px 5px', verticalAlign: 'middle', textAlign: 'center' }}>
              <tbody>

                <tr style={{ height: '87px' }}>
                  <td colSpan={2} style={{ textAlign: 'left', verticalAlign: 'top' }}>
                    <table border={0} style={{ width: '100%' }}><tbody><tr>
                      <td style={{ width: '23%' }}>&nbsp;</td>
                      <td colSpan={1} valign="middle" style={{ textAlign: 'left', verticalAlign: 'top', padding: '0px 5px' }}>
                        <table style={{ width: '100%', textAlign: 'left', verticalAlign: 'top', marginTop: '20px' }}><tbody>
                          <tr>
                            <td width="60%" rowSpan={2} align="left" style={{ textAlign: 'left', verticalAlign: 'bottom' }} valign="bottom">{customerCenter}</td>
                            <td width="40%" align="center">&nbsp;</td>
                          </tr>
                          <tr><td colSpan={1} className="header-td-ur" style={{ textAlign: 'center' }}>&#x06A9;&#x0633;&#x0679;&#x0645;&#x0631; &#x0633;&#x0631;&#x0648;&#x0633; &#x0633;&#x06CC;&#x0646;&#x0679;&#x0631;</td></tr>
                          <tr>
                            <td style={{ textAlign: 'right' }}>{customerPhone}</td>
                            <td colSpan={1} className="header-td-ur" style={{ textAlign: 'center' }}>&#x06A9;&#x0627; &#x067E;&#x062A;&#x06C1; &#x0641;&#x0648;&#x0646; &#x0646;&#x0645;&#x0628;&#x0631;</td>
                          </tr>
                        </tbody></table>
                      </td>
                      <td style={{ width: '25%' }}>&nbsp;</td>
                    </tr></tbody></table>
                  </td>
                </tr>

                <tr style={{ height: '167px', verticalAlign: 'top' }}>
                  <td colSpan={2}>
                    <table border={0} style={{ width: '100%' }}><tbody><tr>
                      <td style={{ width: '48%', verticalAlign: 'top', paddingTop: '0px', paddingLeft: '5px' }} valign="top">
                        <table border={0} style={{ width: '100%', padding: '5px', height: '83px' }}><tbody>
                          <tr style={{ height: '18px' }} className="bdr-bt">
                            <td width="10%" className="txt-lt" style={{ fontSize: '10px' }}>Name:</td>
                            <td width="5%" className="header-td-ur txt-lt">&#x0646;&#x0627;&#x0645;</td>
                            <td width="80%" className="data-td-en bdr-bt" style={{ fontSize: '10px' }}>{consumerName}</td>
                          </tr>
                          <tr style={{ height: '18px' }} className="bdr-bt">
                            <td className="txt-lt" style={{ fontSize: '10px' }}>Address:&nbsp;</td>
                            <td className="header-td-ur txt-lt">&#x067E;&#x062A;&#x06C1;</td>
                            <td className="data-td-en bdr-bt" style={{ fontSize: '10px' }}>{address}</td>
                          </tr>
                          <tr style={{ height: '15px' }} className="bdr-bt">
                            <td>&nbsp;</td><td>&nbsp;</td>
                            <td className="data-td-en bdr-bt" style={{ fontSize: '10px' }}>{address2}</td>
                          </tr>
                          <tr style={{ height: '15px' }} className="bdr-bt"><td>&nbsp;</td><td>&nbsp;</td><td className="data-td-en bdr-bt">&nbsp;</td></tr>
                          <tr style={{ height: '15px' }} className="bdr-bt"><td>&nbsp;</td><td>&nbsp;</td><td className="data-td-en bdr-bt">&nbsp;</td></tr>
                        </tbody></table>
                        <table border={0} style={{ width: '100%', padding: '5px', height: '84px' }}><tbody>
                          <tr style={{ height: '15px' }}><td colSpan={3} className="txt-lt" style={{ fontSize: '10px' }}>&nbsp;</td><td className="data-td-en" colSpan={2} style={{ fontSize: '10px' }}>&nbsp;</td></tr>
                          <tr style={{ height: '15px' }}>
                            <td colSpan={3} className="txt-lt" style={{ fontSize: '10px' }}>Consumer&apos;s CNIC#:{cnic}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                            <td className="data-td-en" colSpan={2} style={{ fontSize: '10px' }}>Security: {security}</td>
                          </tr>
                          <tr style={{ height: '15px' }}>
                            <td colSpan={4} className="txt-lt" style={{ fontSize: '10px' }}>Zone/Postal Code (Service Cycle)/ Book/Page No</td>
                            <td className="data-td-en txt-bld" style={{ fontSize: '10px' }}>{zoneBook}</td>
                          </tr>
                          <tr style={{ height: '30px' }}>
                            <td colSpan={3} className="txt-bld txt-lt" style={{ fontSize: '10px' }}>Tariff: {tariff}</td>
                            <td className="data-td-en txt-bld" colSpan={2} style={{ fontSize: '10px' }}>Issue Date: {issueDate}</td>
                          </tr>
                        </tbody></table>
                      </td>
                      <td valign="top" align="left" style={{ width: '47%', paddingTop: '0px', paddingLeft: '10px', height: '167px' }}>
                        <table border={0} width="100%" style={{ height: '167px' }}><tbody>
                          <tr style={{ height: '30px' }}><td width="56%" style={{ fontSize: '14px', fontWeight: '800', textAlign: 'right' }}>{consumerNo}</td><td width="44%" style={{ fontSize: '10px' }}>&nbsp;</td></tr>
                          <tr style={{ height: '30px' }}><td style={{ fontSize: '10px' }}>&nbsp;</td><td style={{ textAlign: 'center', fontSize: '12px', fontWeight: '800' }}>{billingMonth}</td></tr>
                          <tr style={{ height: '30px' }}><td style={{ fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>{totalWithin}</td><td style={{ fontSize: '10px' }}>&nbsp;</td></tr>
                          <tr style={{ height: '17px' }}><td style={{ fontSize: '10px' }}>&nbsp;</td><td style={{ fontSize: '10px' }}>&nbsp;</td></tr>
                          <tr style={{ height: '30px' }}><td style={{ fontSize: '10px' }}>&nbsp;</td><td style={{ fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>{dueDate}</td></tr>
                          <tr style={{ height: '30px' }}><td style={{ fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{totalAfter}</td><td style={{ fontSize: '10px' }}>&nbsp;</td></tr>
                        </tbody></table>
                      </td>
                    </tr></tbody></table>
                  </td>
                </tr>

                <tr style={{ height: '365px' }}>
                  <td colSpan={2} valign="top" style={{ verticalAlign: 'top', paddingTop: '0px', height: '365px' }}>
                    <table border={0} style={{ width: '100%', height: '365px' }}><tbody><tr>
                      <td valign="top" width="47%" style={{ verticalAlign: 'top', paddingTop: '0px', paddingRight: '10px' }}>
                        <table border={0} width="100%" style={{ padding: '0px', height: '105px' }}><tbody>
                          <tr style={{ height: '27px' }}><td colSpan={5} style={{ height: '27px', textAlign: 'center' }}>&nbsp;</td><td colSpan={2} style={{ height: '27px', fontSize: '10px' }}>{meterNo}</td></tr>
                          <tr><td className="txt-lt" style={{ fontSize: '10px' }}>&nbsp;</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>Current</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>Previous</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>Difference</td></tr>
                          <tr><td className="txt-lt" style={{ fontSize: '10px' }}>Dates:</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>{currDate}</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>{prevDate}</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>&nbsp;</td></tr>
                          <tr><td className="txt-lt" style={{ fontSize: '10px' }}>Reading:</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>{currReading}</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>{prevReading}</td><td colSpan={2} className="txt-rt" style={{ fontSize: '10px' }}>{diffReading}</td></tr>
                          <tr><td>&nbsp;</td><td colSpan={2}>&nbsp;</td><td colSpan={2}>&nbsp;</td><td colSpan={2}>&nbsp;</td></tr>
                        </tbody></table>
                        <table border={0} width="100%" style={{ padding: '0px', height: '82px' }}><tbody>
                          <tr style={{ height: '4px' }}><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                          <tr style={{ height: '13px' }}><td width="20%" className="txt-lt" style={{ fontSize: '10px' }}>Pres./factor:</td><td width="5%" className="header-td-ur txt-rt">&nbsp;</td><td width="20%" className="txt-ct pd-rt-2p" style={{ fontSize: '10px' }}>{pressureFactor}</td><td width="25%" colSpan={2} className="txt-lt bdr-lt pd-lt-2p" style={{ fontSize: '10px' }}>Gas Consumed HM3</td><td width="20%" className="txt-rt" style={{ fontSize: '10px' }}>{gasConsumed}</td></tr>
                          <tr style={{ height: '13px' }}><td className="txt-lt" style={{ fontSize: '10px' }}>Temp./factor</td><td className="header-td-ur txt-rt">&nbsp;</td><td className="txt-ct pd-rt-2p" style={{ fontSize: '10px' }}>0/0</td><td className="txt-rt bdr-lt" style={{ fontSize: '10px' }}>*MMBTU</td><td className="txt-ct" style={{ fontSize: '10px' }}>&nbsp;</td><td className="txt-rt" style={{ fontSize: '10px' }}>{mmbtu}</td></tr>
                          <tr style={{ height: '13px' }}><td colSpan={2} className="txt-lt" style={{ fontSize: '10px' }}>Super Compressibility</td><td className="txt-rt pd-rt-2p" style={{ fontSize: '10px' }}>0.0000</td><td className="txt-lt bdr-lt pd-lt-2p" style={{ fontSize: '10px' }}>GCV</td><td className="header-td-ur txt-rt">&nbsp;</td><td className="txt-rt" style={{ fontSize: '10px' }}>{gcv}</td></tr>
                          <tr style={{ height: '13px' }}><td className="txt-lt" style={{ fontSize: '10px' }}>&nbsp;</td><td className="txt-ct" style={{ fontSize: '10px' }}>&nbsp;</td><td className="txt-rt pd-rt-2p" style={{ fontSize: '10px' }}>&nbsp;</td><td className="txt-lt bdr-lt pd-lt-2p" style={{ fontSize: '10px' }}>Wobbe Index:</td><td className="header-td-ur txt-rt">&nbsp;</td><td className="txt-rt" style={{ fontSize: '10px' }}>{wobbeIndex}</td></tr>
                          <tr style={{ height: '13px' }}><td>&nbsp;</td><td colSpan={4} className="txt-ct" style={{ fontSize: '10px' }}>* MMBTU=(HM3*GCV/281.7385)&nbsp;&nbsp;</td><td>&nbsp;</td></tr>
                          <tr style={{ height: '13px' }}><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                        </tbody></table>
                        <table border={0} width="100%" style={{ height: '167px' }}><tbody><tr>
                          <td colSpan={3} align="center" valign="top" width="65%" style={{ paddingTop: '5px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://www.sngpl.com.pk/imageservlet?consumer=${consumerNo}&billmon=202608`} width="97%" height="160px" style={{ objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = '/sngpl-meter-photo.jpg'; }} alt="Meter Reading" />
                          </td>
                          <td colSpan={2} align="center" valign="top" width="35%" style={{ paddingTop: '5px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrCode} style={{ width: '155px', height: '150px', zIndex: 10 }} alt="Scan to Pay QR" />
                            <span className="bdr-tp bdr-bt" style={{ display: 'block', fontSize: '10px' }}>SCAN TO PAY</span>
                          </td>
                        </tr></tbody></table>
                      </td>
                      <td valign="top" width="44%" style={{ padding: '0px 20px 0px 10px', height: '365px' }} className="txt-lt">
                        <table width="100%" border={0} style={{ marginLeft: '5px', height: '230px' }} className="txt-8p"><tbody>
                          <tr><td colSpan={3} style={{ height: '20px' }}>&nbsp;</td></tr>
                          <tr className="bdr-bt"><td width="34%" className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Gas Charges</td><td width="33%" className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x06AF;&#x06CC;&#x0633; &#x06A9;&#x06CC;  &#x0642;&#x06CC;&#x0645;&#x062A;</td><td width="30%" className="txt-rt" style={{ fontSize: '8px' }}>{gasCharges}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Prov.Bill Adjustment</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x0628;&#x0644; &#x0645;&#x06CC;&#x06BA; &#x0639;&#x0628;&#x0648;&#x0631;&#x06CC; &#x062A;&#x0635;&#x062D;&#x06CC;&#x062D;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{provAdj}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Meter Rent</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x0645;&#x06CC;&#x0679;&#x0631; &#x06A9;&#x0627; &#x06A9;&#x0631;&#x0627;&#x06CC;&#x06C1;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{meterRent}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Fixed Charges</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x0641;&#x06A9;&#x0633;&#x0688; &#x0686;&#x0627;&#x0631;&#x062C;&#x0632;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{fixedCharges}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>GST</td><td className="header-td-ur" style={{ fontSize: '8px' }}>&#x062C;&#x0646;&#x0631;&#x0644; &#x0633;&#x06CC;&#x0644;&#x0632;&#x0679;&#x06CC;&#x06A9;&#x0633;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{gst}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Rebate / Adjustment</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x0686;&#x06BE;&#x0648;&#x ط / &#x062A;&#x0635;&#x062D;&#x06CC;&#x062D;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{rebate}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Security Deposit</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x0633;&#x06CC;&#x06A9;&#x06CC;&#x0648;&#x0631;&#x0679;&#x06CC; &#x0688;&#x067E;&#x0627;&#x0632;&#x0679;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{secDeposit}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Current Bill</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x0645;&#x0648;&#x062C;&#x0648;&#x062F;&#x06C1; &#x0628;&#x0644;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{currentBill}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Arrears / Aging</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x0628;&#x0642;&#x0627;&#x06CC;&#x0627; &#x062C;&#x0627;&#x062A;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{arrears}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Late Payment Surcharge (Rs.)</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x062A;&#x0627;&#x062E;&#x06CC;&#x0631; &#x0633;&#x06D2; &#x0627;&#x062F;&#x0627;&#x0626;&#x06CC;&#x06AF;&#x06CC; &#x067E;&#x0631; &#x0633;&#x0631;&#x0686;&#x0627;&#x0631;&#x062C;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{lateSurcharge}</td></tr>
                          <tr className="bdr-bt"><td className="header-td-en txt-8p" style={{ fontSize: '8px' }}>Total Amount Due</td><td className="header-td-ur txt-8p" style={{ fontSize: '8px' }}>&#x0648;&#x0627;&#x062C;&#x0628; &#x0627;&#x0644;&#x0627;&#x062F;&#x0627;&#x0631;&#x0642;&#x0645;</td><td className="txt-rt" style={{ fontSize: '8px' }}>{totalWithin}</td></tr>
                        </tbody></table>
                        <table border={0} width="100%" style={{ marginTop: '15px', height: '118px' }}><tbody><tr><td className="txt-lt txt-tp">
                          <table width="100%" border={0}><tbody>
                            <tr><td colSpan={2} className="txt-lt"></td></tr>
                            <tr><td colSpan={2}>&nbsp;</td></tr>
                            <tr><td colSpan={2} align="left"><br />&nbsp;</td></tr>
                            <tr><td colSpan={2}></td></tr>
                            <tr><td colSpan={2}>&nbsp;</td></tr>
                          </tbody></table>
                        </td></tr></tbody></table>
                      </td>
                    </tr></tbody></table>
                  </td>
                </tr>

                <tr>
                  <td valign="top" width="47%" style={{ padding: '8px 2px 0px 2px' }}>
                    <table width="100%" border={0}><tbody>
                      <tr style={{ height: '13px' }}><td colSpan={5} style={{ height: '13px' }}>&nbsp;</td></tr>
                      <tr style={{ height: '18px' }}><td width="15%" style={{ fontSize: '10px' }}>Month</td><td width="15%" style={{ fontSize: '10px' }}>HM3</td><td width="23%" style={{ fontSize: '10px' }}>Current Bill</td><td width="23%" style={{ fontSize: '10px' }}>Amount Due</td><td width="23%" style={{ fontSize: '10px' }}>Payment</td></tr>
                      <tr><td colSpan={5}>
                        <table width="100%" border={1} style={{ borderCollapse: 'collapse' }}><tbody>
                          <tr style={{ height: '1px' }}><td width="15%"></td><td width="15%"></td><td width="23%"></td><td width="23%"></td><td width="23%"></td></tr>
                          {history.map((row, idx) => (
                            <tr key={idx} style={{ height: '14px' }}>
                              <td width="15%" className="history" style={{ fontSize: '10px' }}>{row.month}</td>
                              <td width="15%" className="history" style={{ fontSize: '10px' }}>{row.hm3}</td>
                              <td width="23%" align="right" className="history" style={{ fontSize: '10px' }}>{row.currentBill}</td>
                              <td width="23%" align="right" className="history" style={{ fontSize: '10px' }}>{row.amountDue}</td>
                              <td width="23%" align="right" className="history" style={{ fontSize: '10px' }}>{row.payment}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </td></tr>
                    </tbody></table>
                  </td>
                  <td valign="top" width="44%" style={{ padding: '0px 8px 0px 5px' }}>
                    <table width="100%" border={0} style={{ height: '55px' }}><tbody><tr><td colSpan={2} className="txt-lt"><span className="txt-9p txt-lt" style={{ padding: '0px 5px' }}>&nbsp;</span><span className="txt-lt" style={{ padding: '0px 5px' }}>&nbsp;</span></td></tr></tbody></table>
                    <table width="100%" border={0} style={{ height: '190px' }}><tbody><tr><td style={{ padding: '20px 0px 0px 5px', height: '190px' }} className="txt-tp">
                      <table width="100%" border={1} style={{ borderCollapse: 'collapse' }}><tbody>
                        <tr><td colSpan={2} className="txt-tp" style={{ fontSize: '10px' }}>DOMU &nbsp; Gas Rates w.e.f. 01-07-2025</td></tr>
                        <tr><td colSpan={2} className="txt-tp" style={{ height: '25px', fontSize: '9px' }}>** Non-protected Category to pay  fixed charges Rs.1,500/- upto 1.5 hm3, while Rs.3,000/- for exceeding consumption of 1.5 hm3.</td></tr>
                        <tr>
                          <td className="txt-tp" style={{ width: '50%', height: '145px' }}>
                            <table width="100%" border={0}><tbody>
                              <tr className="bdr-bt"><td className="txt-ct txt-tp" style={{ fontSize: '9px' }}>Slab</td><td className="txt-ct txt-tp" style={{ fontSize: '9px' }}>Usage of Gas in Hm3</td><td className="txt-ct txt-tp" style={{ fontSize: '9px' }}>Rs.Per MMBTU</td></tr>
                              {[{s:'1',u:'Up to 0.25',r:'500'},{s:'2',u:'Up to 0.60',r:'850'},{s:'3',u:'Up to 1',r:'1250'},{s:'4',u:'Up to 1.5',r:'1450'},{s:'5',u:'Up to 2',r:'1900'},{s:'6',u:'Up to 3',r:'3300'},{s:'7',u:'Up to 4.',r:'3800'},{s:'8',u:'Above 4',r:'4200'}].map((row)=>(
                                <tr key={row.s} className="bdr-bt"><td style={{ fontSize: '9px' }}>{row.s}</td><td style={{ fontSize: '9px' }}>{row.u}</td><td style={{ fontSize: '9px' }}>{row.r}</td></tr>
                              ))}
                            </tbody></table>
                          </td>
                          <td className="txt-tp" style={{ width: '50%', height: '145px' }}>
                            <table width="100%" border={0} style={{ height: '145px' }}><tbody>
                              <tr><td className="txt-ct" style={{ height: '115px' }}><span className="txt-ct" style={{ fontSize: '8pt', padding: '2px' }}>There shall be one preceding slab benefit available to domestic consumers except for consumers above 4hm3.</span></td></tr>
                              <tr><td className="txt-tp" style={{ height: '28px', fontSize: '9px' }}>Usage of Gas based on 30 Days</td></tr>
                            </tbody></table>
                          </td>
                        </tr>
                      </tbody></table>
                    </td></tr></tbody></table>
                  </td>
                </tr>

                <tr style={{ height: '35px' }}><td height="35px" colSpan={2} width="100%">&nbsp;</td></tr>

                <tr>
                  <td height="40px" colSpan={2} width="100%">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={barcode} alt="Bar code" height="35px" width="340px" style={{ paddingRight: '20px', paddingTop: '0px', float: 'right' }} />
                  </td>
                </tr>

                <tr style={{ height: '30px' }}>
                  <td height="30px" colSpan={2} width="100%" className="txt-tp txt-rt" style={{ verticalAlign: 'top', textAlign: 'right', paddingRight: '40px', fontSize: '10px' }}>{barcodeText}</td>
                </tr>

                <tr><td colSpan={2}>
                  <table border={0} width="100%"><tbody><tr>
                    <td width="45%" className="txt-tp">
                      <table border={0} width="205px"><tbody>
                        <tr style={{ height: '18px' }}><td width="70px" className="txt-tp txt-lt" style={{ fontSize: '10px' }}>Account ID</td><td className="txt-bld txt-lt" style={{ fontSize: '10px' }}>{consumerNo}</td></tr>
                        <tr style={{ height: '18px' }}><td className="txt-tp txt-lt" style={{ fontSize: '10px' }}>Billing Month</td><td className="txt-tp txt-lt" style={{ fontSize: '10px' }}>{billingMonth}</td></tr>
                        <tr style={{ height: '55px' }}><td className="txt-tp txt-lt" style={{ fontSize: '10px' }}>Name</td><td className="txt-tp txt-lt" style={{ fontSize: '10px' }}>{consumerName}</td></tr>
                      </tbody></table>
                    </td>
                    <td width="55%" className="txt-tp">
                      <table width="100%" border={0}><tbody>
                        <tr style={{ height: '20px' }}><td style={{ fontSize: '10px' }}>Account ID</td><td className="txt-bld txt-lt txt-13p" style={{ fontSize: '13px' }}>{consumerNo}</td><td>&nbsp;</td></tr>
                        <tr style={{ height: '41px' }}><td width="32%" style={{ padding: '0px 10px', verticalAlign: 'middle' }}></td><td width="33%" style={{ padding: '0px 16px', textAlign: 'center', verticalAlign: 'middle' }}></td><td width="33%" style={{ padding: '0px 10px', textAlign: 'left', verticalAlign: 'middle' }}></td></tr>
                        <tr style={{ height: '20px' }} className="txt-bld">
                          <td className="txt-bld txt-13p" style={{ fontSize: '13px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{totalWithin}</td>
                          <td className="txt-bld" style={{ fontSize: '10px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{totalAfter}</td>
                          <td className="txt-bld txt-13p" style={{ fontSize: '13px' }}>{dueDate}</td>
                        </tr>
                      </tbody></table>
                    </td>
                  </tr></tbody></table>
                </td></tr>

              </tbody>
            </table>
          </div>{/* end overlay div */}
        </div>{/* end relative container */}
        </div>{/* end sngpl-printable-bill scaled div */}
      </div>{/* end clipping wrapper */}
    </div>
  );
}
