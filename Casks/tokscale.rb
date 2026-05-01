cask "tokscale" do
  version "0.1.0"
  sha256 "148f2f415a7a8efa07e5d6bbbe2ac03060319e3a2afb1d051f2ca72fee2becae"

  url "https://github.com/handlecusion/tokscale-3d/releases/download/v#{version}/Tokscale_#{version}_aarch64.dmg"
  name "Tokscale"
  desc "Menubar dashboard for tokscale CLI token usage"
  homepage "https://github.com/handlecusion/tokscale-3d"

  depends_on macos: ">= :big_sur"
  depends_on formula: "tokscale"

  app "Tokscale.app"

  zap trash: [
    "~/Library/Application Support/com.handlecusion.tokscale3d",
    "~/Library/Preferences/com.handlecusion.tokscale3d.plist",
    "~/Library/Caches/com.handlecusion.tokscale3d",
    "~/Library/Saved Application State/com.handlecusion.tokscale3d.savedState",
    "~/Library/LaunchAgents/com.handlecusion.tokscale3d.plist",
  ]
end
