import { createPublicInfoPage } from "@/lib/public-info-page";

const infoPage = createPublicInfoPage("privacy-policy");

export const generateMetadata = infoPage.generateMetadata;
export default infoPage.default;
