import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE = path.join(__dirname, '../fixtures/ecoli_novel.fa')

test.describe('MASHX e2e — file upload and results', () => {
  test('loads the app and shows upload controls', async ({ page }) => {
    await page.goto('/')

    // FileUpload component from @genomicx/ui should be visible
    await expect(page.locator('input[type="file"]')).toBeAttached()

    // Run button should exist but be disabled until files + db are selected
    const runButton = page.getByRole('button', { name: /run mash distance/i })
    await expect(runButton).toBeVisible()
    await expect(runButton).toBeDisabled()
  })

  test('uploading a FASTA file enables the file zone', async ({ page }) => {
    await page.goto('/')

    // Upload via hidden file input
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(FIXTURE)

    // After upload the file input or surrounding zone should acknowledge the file
    // The controls-row FileUpload should now show the filename
    await expect(page.getByText('ecoli_novel.fa')).toBeVisible({ timeout: 10_000 })

    // Run button is still disabled (no database selected yet) — just verify it hasn't crashed
    const runButton = page.getByRole('button', { name: /run mash distance/i })
    await expect(runButton).toBeVisible()
  })
})
