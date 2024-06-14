FROM docker.io/library/alpine AS builder

COPY build/ /build/

RUN mkdir /sysroot \
 && tar -xf /build/$(uname -m).tar.gz -C /sysroot \
 && ln -s /system_ext/apex/com.android.runtime /sysroot/apex/com.android.runtime \
 && touch /sysroot/linkerconfig/ld.config.txt

FROM scratch AS toybox

COPY --from=builder /sysroot /

RUN cd /system/bin \
 && toybox | toybox xargs -n 1 -- toybox ln -s toybox \
 && cd / \
 && mkdir -p /data/local/tmp \
             /run \
             /var \
 && chmod a+rwx /data/local/tmp \
 && ln -s /data/local/tmp /tmp \
 && ln -s /run /var/run

FROM scratch

COPY --from=toybox / /

ENTRYPOINT ["/bin/sh", "-c", "/bin/sh -T /dev/ptmx -c dnsmasq 2>/dev/null; exec \"$@\"", "--"]
CMD ["/bin/sh"]
