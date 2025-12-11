import { LaporanDrainase, Material } from "@/types/laporan";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Delimiter used for aggregating multiple entries in the form
const AGGREGATION_DELIMITER = '; ';
const MATERIAL_DELIMITER = ';;'; // A distinct delimiter for materials

export const generatePDF = async (data: LaporanDrainase, downloadNow: boolean = true): Promise<Blob> => {

  // Convert images to base64
  const getBase64 = async (file: File | string | null): Promise<string> => {
    return new Promise(async (resolve) => {
      if (!file) {
        resolve("");
        return;
      }
      if (typeof file === 'string') {
        // If it's a URL, fetch its content to convert to base64
        try {
          const response = await fetch(file);
          if (!response.ok) throw new Error(`Failed to fetch image from URL: ${file}`);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error converting URL to base64:", error);
          resolve(""); // Resolve with empty string on error
        }
        return;
      }
      // If it's a File object, read it as Data URL
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Convert all images for all activities
  const kegiatansWithImages = await Promise.all(
    data.kegiatans.map(async (kegiatan) => ({
      ...kegiatan,
      foto0Base64: await Promise.all(kegiatan.foto0.map(f => getBase64(f))), // Map over array
      foto50Base64: await Promise.all(kegiatan.foto50.map(f => getBase64(f))), // Map over array
      foto100Base64: await Promise.all(kegiatan.foto100.map(f => getBase64(f))), // Map over array
      fotoSketBase64: await Promise.all(kegiatan.fotoSket.map(f => getBase64(f))), // Map over array
    }))
  );

  // Helper to render content with separators
  const renderContentWithSeparators = (content: string | string[], isMaterialList: boolean = false) => {
    if (!content) return '-';
    let items: string[] = [];
    if (Array.isArray(content)) {
      items = content.filter(Boolean);
    } else {
      items = content.split(isMaterialList ? MATERIAL_DELIMITER : AGGREGATION_DELIMITER).filter(Boolean);
    }

    if (items.length === 0) return '-';

    return items.map((item, idx) => `
      ${idx > 0 ? '<hr style="border-top: 1px dashed #ccc; margin: 2px 0;" />' : ''}
      <span>${item}</span>
    `).join('');
  };

  // Helper to render material list with separators
  const renderMaterialListWithSeparators = (materials: Material[]) => {
    if (!materials || materials.length === 0) return { jenis: '-', jumlah: '-', satuan: '-' };

    const jenisList: string[] = [];
    const jumlahList: string[] = [];
    const satuanList: string[] = [];

    materials.forEach(m => {
      jenisList.push(m.jenis || '-');
      jumlahList.push(m.jumlah || '-');
      satuanList.push(m.satuan || '-');
    });

    return {
      jenis: renderContentWithSeparators(jenisList, true),
      jumlah: renderContentWithSeparators(jumlahList, true),
      satuan: renderContentWithSeparators(satuanList, true),
    };
  };


  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Drainase - ${data.periode}</title>
      <style>
        @page {
          size: A3 landscape; /* Changed to A3 landscape */
          margin: 10mm;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 7pt;
          line-height: 1.2;
          color: #000;
          margin: 0;
          padding: 0;
        }

        .header {
          text-align: center;
          margin-bottom: 5px;
        }

        .header .office {
          margin: 2px 0;
          font-size: 9pt;
          font-weight: bold;
          color: #000;
        }

        .header .address {
          margin: 2px 0;
          font-size: 7pt;
          color: #000;
        }

        .report-title {
          text-align: center;
          font-size: 9pt;
          font-weight: bold;
          margin: 5px 0 10px 0;
          text-transform: uppercase;
        }

        .period {
          margin-bottom: 10px;
          font-size: 8pt;
          font-weight: bold;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto; /* Added for automatic column width */
        }

        table th {
          background-color: #fff;
          padding: 4px 3px;
          text-align: center;
          font-weight: bold;
          border: 1px solid #000;
          font-size: 6pt;
          vertical-align: middle;
        }

        table td {
          padding: 3px;
          border: 1px solid #000;
          font-size: 6pt;
          vertical-align: top;
        }

        .photo-cell {
          text-align: center;
          padding: 2px;
        }

        .photo-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2px; /* Small gap between images */
          justify-content: center;
        }

        .photo-container img {
          width: 45px; /* Smaller width for multiple images */
          height: 34px; /* Smaller height for multiple images */
          object-fit: cover;
          border: 1px solid #ccc;
        }

        .material-list, .equipment-list, .koordinator-list { /* Added .koordinator-list */
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .material-list li, .equipment-list li, .koordinator-list li { /* Added .koordinator-list li */
          margin-bottom: 2px;
          font-size: 6pt;
        }

        .center {
          text-align: center;
        }

        /* Removed all fixed width definitions for columns */
        .no-col, .date-col, .location-col, .jenis-col, .number-col, .personil-col,
        .material-jenis-col, .material-jumlah-col, .material-satuan-col,
        .peralatan-jenis-col, .peralatan-jumlah-col, .keterangan-col {
          /* width properties removed */
          text-align: center; /* Keep text alignment */
        }
        .location-col, .personil-col {
          text-align: left; /* Adjust specific text alignment if needed */
        }
        .keterangan-col {
          text-align: left;
        }


        @media print {
          body {
            padding: 0;
          }
          
          @page {
            size: A3 landscape; /* Changed to A3 landscape */
            margin: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="office">UPT OPERASIONAL PEMELIHARAAN JALAN DAN DRAINASE MEDAN KOTA</div>
        <div class="address">Jl. Garu I No.101, Kelurahan Sitirejo III, Kecamatan Medan Amplas</div>
        <div class="report-title">LAPORAN HARIAN PEMELIHARAAN DRAINASE</div>
      </div>

      <div class="period">Periode : ${data.periode}</div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" class="no-col">No</th>
            <th rowspan="2" class="date-col">Hari/ Tanggal</th>
            <th rowspan="2" class="location-col">Lokasi</th>
            <th colspan="4">Foto Dokumentasi</th> <!-- Changed colspan to 4 for Foto Sket -->
            <th rowspan="2" class="jenis-col">Jenis Saluran<br/>(Terbuka/ Tertutup)</th>
            <th rowspan="2" class="jenis-col">Jenis Sedimen<br/>(Batu/ Padat/Cair)</th>
            <th rowspan="2">Aktifitas Penanganan</th>
            <th rowspan="2" class="number-col">Panjang Penanganan<br/>(meter)</th>
            <th rowspan="2" class="number-col">Lebar Rata-Rata Saluran<br/>(meter)</th>
            <th rowspan="2" class="number-col">Rata-Rata Sedimen<br/>(meter)</th>
            <th rowspan="2" class="number-col">Volume Galian<br/>(meter³)</th>
            <th colspan="3">Material / Bahan</th>
            <th colspan="2">Peralatan & Alat Berat</th>
            <th colspan="2">Personil UPT</th>
            <th rowspan="2" class="keterangan-col">Ket</th>
          </tr>
          <tr>
            <th class="photo-cell">0%</th>
            <th class="photo-cell">50%</th>
            <th class="photo-cell">100%</th>
            <th class="photo-cell">Sket</th> <!-- New header for Foto Sket -->
            <th class="material-jenis-col">Jenis</th>
            <th class="material-jumlah-col">Jlh.</th>
            <th class="material-satuan-col">Sat.</th>
            <th class="peralatan-jenis-col">Jenis</th>
            <th class="peralatan-jumlah-col">Jlh.</th>
            <th>Koordinator</th>
            <th class="number-col">Jml PHL</th>
          </tr>
        </thead>
        <tbody>
          ${kegiatansWithImages.map((kegiatan, index) => {
            const materials = renderMaterialListWithSeparators(kegiatan.materials);
            return `
            <tr>
              <td class="center">${index + 1}</td>
              <td>${kegiatan.hariTanggal ? format(kegiatan.hariTanggal, "EEEE", { locale: id }) : ''}<br/>${kegiatan.hariTanggal ? format(kegiatan.hariTanggal, "dd/MM/yyyy", { locale: id }) : ''}</td>
              <td>${kegiatan.namaJalan}<br/>Kel. ${kegiatan.kelurahan}<br/>Kec. ${kegiatan.kecamatan}</td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.foto0Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 0%" />` : '').join('')}
                </div>
              </td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.foto50Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 50%" />` : '').join('')}
                </div>
              </td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.foto100Base64.map(base64 => base64 ? `<img src="${base64}" alt="Foto 100%" />` : '').join('')}
                </div>
              </td>
              <td class="photo-cell">
                <div class="photo-container">
                  ${kegiatan.fotoSketBase64.map(base64 => base64 ? `<img src="${base64}" alt="Foto Sket" />` : '').join('')}
                </div>
              </td>
              <td>${renderContentWithSeparators(kegiatan.jenisSaluran)}</td>
              <td>${renderContentWithSeparators(kegiatan.jenisSedimen)}</td>
              <td>${renderContentWithSeparators(kegiatan.aktifitasPenanganan)}</td>
              <td class="center">${kegiatan.panjangPenanganan || '-'}</td>
              <td class="center">${kegiatan.lebarRataRata || '-'}</td>
              <td class="center">${kegiatan.rataRataSedimen || '-'}</td>
              <td class="center">${kegiatan.volumeGalian || '-'}</td>
              <td>${materials.jenis}</td>
              <td class="center">${materials.jumlah}</td>
              <td class="center">${materials.satuan}</td>
              <td>
                <ul class="equipment-list">
                  ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                    <li>${peralatan.nama}</li>
                  `).join('')}
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.jenis}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">
                <ul class="equipment-list">
                  ${kegiatan.peralatans.filter(p => p.nama).map(peralatan => `
                    <li>${peralatan.jumlah}</li>
                  `).join('')}
                  ${kegiatan.operasionalAlatBerats.filter(o => o.jenis).map(op => `
                    <li>${op.jumlah}</li>
                  `).join('')}
                </ul>
              </td>
              <td>
                <ul class="koordinator-list">
                  ${kegiatan.koordinator.map(koordinator => `
                    <li>${koordinator}</li>
                  `).join('')}
                </ul>
              </td>
              <td class="center">${kegiatan.jumlahPHL || '-'}</td>
              <td>${kegiatan.keterangan || ''}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  // Create blob for preview or download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  
  if (downloadNow) {
    // Open in new window for printing/downloading
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
  
  return blob;
};