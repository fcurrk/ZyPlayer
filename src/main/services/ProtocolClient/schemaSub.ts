import { join } from 'node:path';

import { loggerService } from '@logger';
import { t } from '@main/services/AppLocale';
import { fileStorage } from '@main/services/FileStorage';
import { ensureDir, saveFile } from '@main/utils/file';
import { APP_FILE_PATH } from '@main/utils/path';
import { request } from '@main/utils/request';
import { LOG_MODULE } from '@shared/config/logger';
import { dialog } from 'electron';

const logger = loggerService.withContext(LOG_MODULE.APP_PROTOCOL);

/**
 * Handle zy://sub?lang={{lang}}&url={{url}}
 */
export async function handleSubProtocolUrl(url: URL) {
  const lang = url.searchParams.get('lang');
  const subUrl = url.searchParams.get('url');

  if (!lang || !subUrl) return;

  logger.debug('Handling sub protocol URL', { lang, subUrl });

  try {
    let filename = '';
    try {
      filename = new URL(subUrl).pathname.split('/').pop() || '';
    } catch {}

    const baseDir = join(APP_FILE_PATH, lang);
    await ensureDir(baseDir);

    const defaultPath = filename ? join(baseDir, filename) : baseDir;

    const { data } = await request.request({
      url: subUrl,
      method: 'GET',
    });

    const savePath = await fileStorage.saveFileDialog({
      defaultPath,
    });

    if (!savePath) throw new Error('No save path selected');

    const ok = await saveFile(savePath, data, 'utf-8');
    if (!ok) throw new Error('save failed');

    dialog.showMessageBox({
      type: 'info',
      title: t('common.tip'),
      message: t('common.saveSuccess'),
      buttons: [t('common.confirm')],
    });
  } catch (err) {
    logger.error('Error handling sub protocol URL', err as Error);

    dialog.showMessageBox({
      type: 'error',
      title: t('common.tip'),
      message: t('common.saveFail'),
      buttons: [t('common.confirm')],
    });
  }
}
