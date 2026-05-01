cask "tokscale" do
  version "0.1.1"
  sha256 "e7b5f709e1f4323848a84601d0404c5ab5b311b478b4976156d055801ca65dd6"

  url "https://github.com/handlecusion/tokscale-3d/releases/download/v#{version}/Tokscale_#{version}_aarch64.dmg"
  name "Tokscale"
  desc "Menubar dashboard for tokscale CLI token usage"
  homepage "https://github.com/handlecusion/tokscale-3d"

  depends_on macos: ">= :big_sur"
  depends_on formula: "tokscale"

  app "Tokscale.app"

  postflight do
    system_command "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister",
                   args: ["-f", "#{appdir}/Tokscale.app"]
  end

  zap trash: [
    "~/Library/Application Support/com.handlecusion.tokscale3d",
    "~/Library/Preferences/com.handlecusion.tokscale3d.plist",
    "~/Library/Caches/com.handlecusion.tokscale3d",
    "~/Library/Saved Application State/com.handlecusion.tokscale3d.savedState",
    "~/Library/LaunchAgents/com.handlecusion.tokscale3d.plist",
  ]
end
