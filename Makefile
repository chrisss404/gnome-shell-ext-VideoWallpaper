UUID=VideoWallpaper\@chrisss404.gmail.com
INSTALLDIR=~/.local/share/gnome-shell/extensions/$(UUID)

all:

install: local

local: 
	# create dir if not exist
	mkdir -p $(INSTALLDIR)

	# clear dir from contents
	-rm -rf $(INSTALLDIR)/*

	# copy contents
	cp -rf $(UUID)/* $(INSTALLDIR)

	# download Underwater Lights
	wget -O $(INSTALLDIR)/UnderwaterLights.wmv "http://www.movietools.info/video-background-loops/misc-loops.raw?task=callelement&item_id=93&element=b8f08c25-e244-4194-bb88-0c0c88fc6ded&method=download&args[0]=3b6fd76dd30de3f93aeed9e88fa5ad08"

	# download Sunshine
	wget -O $(INSTALLDIR)/Sunshine.ogv "https://archive.org/download/SunshineroyaltyFreeLoopingBackground/Sunshine.ogv"

uninstall:
	# uninstall
	-rm -rf $(INSTALLDIR)

