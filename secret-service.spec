%define version 0.0.19
Group: Development/Languages
Name: secret-service
Provides: ss
Release: 1
Source: secret-service-%{version}.tgz
URL: http://stash/secret-service
Version: %{version}
Buildroot: /tmp/secretservicerpm
Summary: Build tool for Capitol framework
License: MorningStar internal
%description
Build tool for Capitol framework

%prep
%setup -cT

%build
%define debug_package %{nil}
cp $RPM_SOURCE_DIR/secret-service-%{version}.tgz $RPM_BUILD_DIR

%install
mkdir -p $RPM_BUILD_ROOT/usr/lib/
cd $RPM_BUILD_ROOT/usr/lib/
npm install $RPM_BUILD_DIR/secret-service-%{version}.tgz

%post
ln -s /usr/lib/node_modules/.bin/ss /usr/bin/ss

%files
/usr/lib/node_modules/.bin/ss
/usr/lib/node_modules/secret-service