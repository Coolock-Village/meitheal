/**
 * Recursively strips HTML tags from a string.
 *
 * A single-pass regex `/<[^>]*>/g` is insufficient because nested/malformed
 * tags like `<scr<script>ipt>` would leave `<script>` after one pass.
 * This function loops until no tags remain, satisfying CodeQL's
 * "Incomplete multi-character sanitization" rule.
 *
 * @domain tasks (shared utility — cross-domain safe)
 * @see https://codeql.github.com/codeql-query-help/javascript/js-incomplete-multi-character-sanitization/
 */
const TAG_RE = /<[^>]*>/g;

export function stripHtml(input: string): string {
  let result = input;
  while (TAG_RE.test(result)) {
    TAG_RE.lastIndex = 0;
    result = result.replace(TAG_RE, "");
  }
  return result;
}
